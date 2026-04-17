import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { EntityManager, CreateRequestContext } from '@mikro-orm/postgresql';
import { RepairRequestStatus } from '@asko/shared';
import { RepairRequest } from 'modules/repair-request/entities/repair-request.entity';
import { Repairer } from 'modules/repairer/entities/repairer.entity';
import { RepairRequestService } from 'modules/repair-request/services/repair-request.service';
import { OvertimeService } from './overtime.service';
import { ScheduleOverrideService } from './schedule-override.service';
import { VacationService } from './vacation.service';
import { SickLeaveService } from './sick-leave.service';
import { WSchedulePatternService } from './wschedule-pattern.service';
import { Address } from 'modules/device/entities/address.entity';
import { RepairEventService, RepairEventType } from 'services/repair-event.service';
import { getLocalNow, DEFAULT_TIMEZONE } from 'common/timezone';

const CONFIRMATION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

@Injectable()
export class ScheduleEndSweepService {
    private readonly logger = new Logger(ScheduleEndSweepService.name);

    constructor(
        private readonly em: EntityManager,
        private readonly repairRequestService: RepairRequestService,
        private readonly overtimeService: OvertimeService,
        private readonly overrideService: ScheduleOverrideService,
        private readonly vacationService: VacationService,
        private readonly sickLeaveService: SickLeaveService,
        private readonly schedulePatternService: WSchedulePatternService,
        private readonly events: RepairEventService,
    ) { }

    @Cron('* * * * *')
    @CreateRequestContext()
    async sweep(): Promise<void> {
        const activeRequests = await this.em.find(
            RepairRequest,
            {
                status: { $in: [RepairRequestStatus.ACCEPTED, RepairRequestStatus.IN_PROGRESS] },
                repairer: { $ne: null },
            },
            { populate: ['repairer'] },
        );

        if (activeRequests.length === 0) return;

        const byRepairer = new Map<string, { repairer: Repairer; requests: RepairRequest[] }>();
        for (const req of activeRequests) {
            const repairer = req.repairer as Repairer;
            if (!repairer?.userId) continue;
            let group = byRepairer.get(repairer.userId);
            if (!group) {
                group = { repairer, requests: [] };
                byRepairer.set(repairer.userId, group);
            }
            group.requests.push(req);
        }

        // Batch-load timezones to avoid N+1 on Address table
        const userIds = [...byRepairer.keys()];
        const addresses = await this.em.find(Address, { userId: { $in: userIds }, isPrimary: true });
        const tzMap = new Map(addresses.map(a => [a.userId, a.timezone ?? DEFAULT_TIMEZONE]));

        const now = new Date();
        for (const [repairerUserId, { repairer, requests }] of byRepairer) {
            try {
                const tz = tzMap.get(repairer.userId) ?? DEFAULT_TIMEZONE;
                const { todayStart } = getLocalNow(tz);
                await this.processRepairer(repairerUserId, requests, now, todayStart);
            } catch (e) {
                this.logger.error(
                    `Schedule-end sweep failed for repairer ${repairerUserId}: ${(e as Error).message}`,
                );
            }
        }
    }

    private async processRepairer(
        repairerUserId: string,
        requests: RepairRequest[],
        now: Date,
        todayStart: Date,
    ): Promise<void> {
        const endTime = await this.resolveEffectiveEndTime(repairerUserId, now, todayStart);
        if (!endTime) return;

        const endMs = endTime.getTime();
        const deadlineMs = endMs + CONFIRMATION_TIMEOUT_MS;

        for (const request of requests) {
            if (request.scheduleEndConfirmedAt && request.scheduleEndConfirmedAt >= todayStart) {
                continue;
            }

            if (now.getTime() >= endMs && (!request.scheduleEndNotifiedAt || request.scheduleEndNotifiedAt < todayStart)) {
                request.scheduleEndNotifiedAt = now;
                await this.em.flush();

                await this.events.emit({
                    type: RepairEventType.SCHEDULE_ENDING,
                    repairId: request.id,
                    userId: request.userId,
                    repairerUserId,
                    timestamp: now,
                });

                this.logger.log(
                    `Schedule-end notification sent: repairer=${repairerUserId} request=${request.id}`,
                );
            }

            if (
                now.getTime() >= deadlineMs &&
                request.scheduleEndNotifiedAt && request.scheduleEndNotifiedAt >= todayStart &&
                (!request.scheduleEndConfirmedAt || request.scheduleEndConfirmedAt < todayStart)
            ) {
                await this.repairRequestService.autoPauseForScheduleEnd(request.id);
                this.logger.warn(
                    `Auto-paused: repairer=${repairerUserId} request=${request.id} (no confirmation within 30min)`,
                );
            }
        }
    }

    private async resolveEffectiveEndTime(
        repairerUserId: string,
        now: Date,
        todayStart: Date,
    ): Promise<Date | null> {
        const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000 - 1);

        // Check for vacation / sick leave — if present, repairer is off
        const [vacationBlock, sickLeaveBlock] = await Promise.all([
            this.vacationService.findBlockingToday(repairerUserId, todayStart),
            this.sickLeaveService.findBlockingToday(repairerUserId, todayStart),
        ]);
        if (vacationBlock || sickLeaveBlock) return null;

        // Check for approved overtime / schedule override entries covering today
        const [overtimes, overrides] = await Promise.all([
            this.overtimeService.findTodayEntries(repairerUserId, todayStart, todayEnd),
            this.overrideService.findTodayEntries(repairerUserId, todayStart, todayEnd),
        ]);

        // Resolve pattern slot for today
        const patternSlot = await this.schedulePatternService.resolveSlotForDate(repairerUserId, now);

        let latestEndTime: Date | null = null;

        if (patternSlot?.work) {
            const patternEnd = this.timeToDate(patternSlot.endTime, todayStart);
            if (patternEnd) latestEndTime = patternEnd;
        }

        const allTimeEntries = [...overtimes, ...overrides];
        for (const entry of allTimeEntries) {
            const entryEnd = this.timeToDate(entry.endTime, todayStart);
            if (entryEnd && (!latestEndTime || entryEnd > latestEndTime)) {
                latestEndTime = entryEnd;
            }
        }

        return latestEndTime;
    }

    private timeToDate(time: string, dayStart: Date): Date | null {
        const parts = time.split(':');
        if (parts.length < 2) return null;
        const hours = parseInt(parts[0], 10);
        const minutes = parseInt(parts[1], 10);
        if (isNaN(hours) || isNaN(minutes)) return null;
        return new Date(dayStart.getTime() + hours * 60 * 60 * 1000 + minutes * 60 * 1000);
    }
}
