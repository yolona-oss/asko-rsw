import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { EntityManager, CreateRequestContext } from '@mikro-orm/postgresql';
import { RepairRequestStatus } from '@asko/shared';
import { RepairRequest } from 'modules/repair-request/entities/repair-request.entity';
import { WSchedule, ScheduleEntryType, ScheduleStatus } from '../entities/wschedule.entity';
import { Repairer } from 'modules/repairer/entities/repairer.entity';
import { RepairRequestService } from 'modules/repair-request/services/repair-request.service';
import { WScheduleService } from './wschedule.service';
import { WSchedulePatternService } from './wschedule-pattern.service';
import { RepairEventService, RepairEventType } from 'services/repair-event.service';
import { getLocalNow } from 'common/timezone';

const CONFIRMATION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

@Injectable()
export class ScheduleEndSweepService {
    private readonly logger = new Logger(ScheduleEndSweepService.name);

    constructor(
        private readonly em: EntityManager,
        private readonly repairRequestService: RepairRequestService,
        private readonly scheduleService: WScheduleService,
        private readonly schedulePatternService: WSchedulePatternService,
        private readonly events: RepairEventService,
    ) {}

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

        // Group requests by repairer userId
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

        for (const [repairerUserId, { repairer, requests }] of byRepairer) {
            try {
                const tz = await this.scheduleService.resolveTimezone(repairer.userId);
                const now = new Date();
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
        if (!endTime) return; // no work schedule today or cannot determine endTime

        const endMs = endTime.getTime();
        const deadlineMs = endMs + CONFIRMATION_TIMEOUT_MS;

        for (const request of requests) {
            // Already confirmed today — skip
            if (request.scheduleEndConfirmedAt && request.scheduleEndConfirmedAt >= todayStart) {
                continue;
            }

            // Phase 1: schedule end reached → notify (once per day)
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

            // Phase 2: 30min past end → auto-pause if not confirmed
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

    /**
     * Determine the effective end time for today. Priority:
     * 1. Approved OVERTIME / EXTRA_DAY entries for today — use latest endTime
     * 2. Schedule pattern slot for today
     * Returns null if repairer is not scheduled to work today.
     */
    private async resolveEffectiveEndTime(
        repairerUserId: string,
        now: Date,
        todayStart: Date,
    ): Promise<Date | null> {
        const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000 - 1);

        // Check for approved overtime / extra_day entries covering today
        const overrides = await this.em.find(WSchedule, {
            userId: repairerUserId,
            status: ScheduleStatus.APPROVED,
            type: { $in: [ScheduleEntryType.OVERTIME, ScheduleEntryType.EXTRA_DAY] },
            dateFrom: { $lte: todayEnd },
            dateTo: { $gte: todayStart },
        });

        // Check for vacation / sick leave — if present, repairer is off
        const leaveEntries = await this.em.find(WSchedule, {
            userId: repairerUserId,
            status: ScheduleStatus.APPROVED,
            type: { $in: [ScheduleEntryType.VACATION, ScheduleEntryType.SICK_LEAVE] },
            dateFrom: { $lte: todayEnd },
            dateTo: { $gte: todayStart },
        });
        if (leaveEntries.length > 0) return null;

        // Resolve pattern slot for today
        const patternSlot = await this.schedulePatternService.resolveSlotForDate(repairerUserId, now);

        // Collect candidate end times
        let latestEndTime: Date | null = null;

        // From pattern
        if (patternSlot?.work) {
            const patternEnd = this.timeToDate(patternSlot.endTime, todayStart);
            if (patternEnd) latestEndTime = patternEnd;
        }

        // From overtime / extra_day overrides — take the latest endTime
        for (const entry of overrides) {
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
