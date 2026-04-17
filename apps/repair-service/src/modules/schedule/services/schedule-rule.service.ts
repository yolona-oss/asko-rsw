import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { VacationService } from './vacation.service';
import { SickLeaveService } from './sick-leave.service';
import { OvertimeService } from './overtime.service';
import { ScheduleOverrideService } from './schedule-override.service';
import { WSchedulePatternService, type ResolvedSlot } from './wschedule-pattern.service';
import { Address } from 'modules/device/entities/address.entity';
import { RepairRequest } from 'modules/repair-request/entities/repair-request.entity';
import { AppErrors } from 'common/error';
import { getLocalNow, getLocalDateAsUtc, DEFAULT_TIMEZONE } from 'common/timezone';

interface RepairerScheduleCtx {
    userId: string;
}

const MAX_OVERTIME_MINUTES_PER_DAY = 4 * 60;
const MIN_REMAINING_SCHEDULE_MINUTES = 30;

@Injectable()
export class ScheduleRuleService {
    constructor(
        private readonly em: EntityManager,
        private readonly vacationService: VacationService,
        private readonly sickLeaveService: SickLeaveService,
        private readonly overtimeService: OvertimeService,
        private readonly overrideService: ScheduleOverrideService,
        private readonly patternService: WSchedulePatternService,
    ) {}

    async resolveTimezone(userId: string): Promise<string> {
        const address = await this.em.findOne(Address, { userId, isPrimary: true });
        return address?.timezone ?? DEFAULT_TIMEZONE;
    }

    async resolveDeviceTimezone(requestId: string): Promise<string | undefined> {
        const request = await this.em.findOne(RepairRequest, { id: requestId }, { populate: ['address'] });
        const address = request?.address as Address | undefined;
        return address?.timezone ?? undefined;
    }

    computeTimezoneOffsetHours(tz1: string, tz2: string): number {
        const t1 = getLocalNow(tz1);
        const t2 = getLocalNow(tz2);
        const diffMs = t1.todayStart.getTime() - t2.todayStart.getTime();
        return Math.round(diffMs / (60 * 60 * 1000));
    }

    async findBlockingToday(userId: string, timezone?: string): Promise<{ type: 'vacation' | 'sick_leave' } | null> {
        const { todayStart, todayEnd } = getLocalNow(timezone ?? DEFAULT_TIMEZONE);

        const [vacation, sickLeave] = await Promise.all([
            this.vacationService.findBlockingToday(userId, todayStart),
            this.sickLeaveService.findBlockingToday(userId, todayStart),
        ]);

        const blocking = vacation ? 'vacation' as const : sickLeave ? 'sick_leave' as const : null;
        if (!blocking) return null;

        const override = await this.overrideService.findBlockingOverride(userId, todayStart, todayEnd);
        if (override) return null;

        return { type: blocking };
    }

    async getTodayOvertimeMinutes(userId: string, timezone?: string): Promise<number> {
        return this.overtimeService.getTodayOvertimeMinutes(userId, timezone);
    }

    private async assertTimeBoundaries(
        repairer: RepairerScheduleCtx,
        slot: ResolvedSlot | null,
        tz: string,
        action: string,
        tzLabel?: string,
    ): Promise<void> {
        const { nowTime, todayStart, todayEnd } = getLocalNow(tz);
        const suffix = tzLabel ? ` (${tzLabel})` : '';

        if (!slot) return;

        if (!slot.work) {
            throw AppErrors.badRequest(`Сегодня выходной день мастера${suffix}. ${action} невозможно`);
        }

        if (nowTime < slot.startTime) {
            throw AppErrors.badRequest(`Рабочий день ещё не начался (начало в ${slot.startTime})${suffix}. ${action} невозможно`);
        }

        if (nowTime > slot.endTime) {
            const [overtimes, overrides] = await Promise.all([
                this.overtimeService.findTodayEntries(repairer.userId, todayStart, todayEnd),
                this.overrideService.findTodayEntries(repairer.userId, todayStart, todayEnd),
            ]);
            const allEntries = [...overtimes, ...overrides];
            const extended = allEntries.some(e => e.endTime && nowTime <= e.endTime);
            if (!extended) {
                throw AppErrors.badRequest(`Рабочий день завершён (окончание в ${slot.endTime})${suffix}. ${action} невозможно`);
            }
        }
    }

    async assertScheduleAllows(repairer: RepairerScheduleCtx, action: string, deviceTimezone?: string): Promise<void> {
        const tz = await this.resolveTimezone(repairer.userId);
        const dateForPattern = getLocalDateAsUtc(tz);

        // 1. Vacation / sick leave (repairer tz only)
        const blocking = await this.findBlockingToday(repairer.userId, tz);
        if (blocking) {
            const label = blocking.type === 'vacation' ? 'отпуске' : 'больничном';
            throw AppErrors.badRequest(`Мастер на ${label}. ${action} невозможно`);
        }

        // 2. Resolve pattern + time boundaries in repairer tz
        const slot = await this.patternService.resolveSlotForDate(repairer.userId, dateForPattern);
        await this.assertTimeBoundaries(repairer, slot, tz, action);

        // 3. Dual-tz: also check in device timezone
        if (deviceTimezone && deviceTimezone !== tz) {
            const deviceDateForPattern = getLocalDateAsUtc(deviceTimezone);
            const deviceSlot = await this.patternService.resolveSlotForDate(repairer.userId, deviceDateForPattern);
            await this.assertTimeBoundaries(repairer, deviceSlot, deviceTimezone, action, 'по месту ремонта');
        }

        // 4. Daily overtime cap (repairer tz only)
        const overtimeMinutesToday = await this.getTodayOvertimeMinutes(repairer.userId, tz);
        if (overtimeMinutesToday >= MAX_OVERTIME_MINUTES_PER_DAY) {
            throw AppErrors.badRequest(`Превышен лимит переработки (${MAX_OVERTIME_MINUTES_PER_DAY / 60}ч/день). ${action} невозможно`);
        }
    }

    async assertEnoughScheduleTime(repairer: RepairerScheduleCtx, deviceTimezone?: string): Promise<void> {
        const checkInTz = async (tz: string) => {
            const { nowTime } = getLocalNow(tz);
            const dateForPattern = getLocalDateAsUtc(tz);
            const slot = await this.patternService.resolveSlotForDate(repairer.userId, dateForPattern);
            if (!slot || !slot.work) return;

            const [nh, nm] = nowTime.split(':').map(Number);
            const [eh, em] = slot.endTime.split(':').map(Number);
            const remainingMinutes = (eh * 60 + em) - (nh * 60 + nm);

            if (remainingMinutes > 0 && remainingMinutes < MIN_REMAINING_SCHEDULE_MINUTES) {
                throw AppErrors.badRequest(
                    `До конца рабочего дня осталось менее ${MIN_REMAINING_SCHEDULE_MINUTES} мин. Назначение невозможно`,
                );
            }
        };

        const tz = await this.resolveTimezone(repairer.userId);
        await checkInTz(tz);
        if (deviceTimezone && deviceTimezone !== tz) {
            await checkInTz(deviceTimezone);
        }
    }

    async ensureExtraDayIfOff(
        repairer: RepairerScheduleCtx,
        requestId: string,
        assignedAt?: Date,
    ): Promise<void> {
        const tz = await this.resolveTimezone(repairer.userId);
        const date = assignedAt ?? new Date();
        const dateForPattern = getLocalDateAsUtc(tz);
        const blocking = await this.findBlockingToday(repairer.userId, tz);
        if (blocking) return;
        const slot = await this.patternService.resolveSlotForDate(repairer.userId, dateForPattern);
        if (slot && slot.work) return;
        const start = slot?.startTime || '09:00';
        const end = slot?.endTime || '18:00';
        await this.overrideService.recordExtraDay(repairer.userId, date, start, end, requestId);
    }

    async recordOvertime(userId: string, date: Date, startTime: string, endTime: string, requestId: string) {
        return this.overtimeService.recordOvertime(userId, date, startTime, endTime, requestId);
    }

    async assertPresenceAllowed(repairer: RepairerScheduleCtx, action: string, deviceTimezone?: string): Promise<void> {
        const tz = await this.resolveTimezone(repairer.userId);
        const blocking = await this.findBlockingToday(repairer.userId, tz);
        if (blocking) {
            const label = blocking.type === 'vacation' ? 'отпуске' : 'больничном';
            throw AppErrors.badRequest(`Мастер на ${label}. ${action} невозможно`);
        }

        const checkRestDay = async (checkTz: string, tzLabel?: string) => {
            const dateForPattern = getLocalDateAsUtc(checkTz);
            const slot = await this.patternService.resolveSlotForDate(repairer.userId, dateForPattern);
            const suffix = tzLabel ? ` (${tzLabel})` : '';
            if (slot && !slot.work) {
                throw AppErrors.badRequest(`Сегодня выходной день${suffix}. ${action} невозможно`);
            }
        };

        await checkRestDay(tz);
        if (deviceTimezone && deviceTimezone !== tz) {
            await checkRestDay(deviceTimezone, 'по месту ремонта');
        }

        const overtimeMinutes = await this.getTodayOvertimeMinutes(repairer.userId, tz);
        if (overtimeMinutes >= MAX_OVERTIME_MINUTES_PER_DAY) {
            throw AppErrors.badRequest(
                `Превышен лимит переработки (${MAX_OVERTIME_MINUTES_PER_DAY / 60}ч/день). ${action} невозможно`,
            );
        }
    }
}
