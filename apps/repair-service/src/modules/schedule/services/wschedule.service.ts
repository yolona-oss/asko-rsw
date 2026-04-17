import { Injectable } from '@nestjs/common';
import { CreateRequestContext, EntityManager } from '@mikro-orm/postgresql';
import { WSchedule, ScheduleEntryType, ScheduleStatus } from '../entities/wschedule.entity';
import { WSchedulePatternService } from './wschedule-pattern.service';
import { AppErrors } from 'common/error';
import { getLocalNow, getLocalDateAsUtc, DEFAULT_TIMEZONE } from 'common/timezone';
import type { CreateScheduleRequest, UpdateScheduleRequest, FindAllSchedulesRequest } from '@asko/proto';

function parseDate(value: string): Date {
    return new Date(value);
}

interface RepairerScheduleCtx {
    userId: string;
    timezone?: string;
}

const MAX_OVERTIME_MINUTES_PER_DAY = 4 * 60;       // 4 hours
const MIN_REMAINING_SCHEDULE_MINUTES = 30;

@Injectable()
export class WScheduleService {
    constructor(
        private readonly em: EntityManager,
        private readonly patternService: WSchedulePatternService,
    ) {}

    @CreateRequestContext()
    async create(data: CreateScheduleRequest): Promise<WSchedule> {
        const entry = new WSchedule();
        entry.userId = data.userId;
        entry.type = data.type as ScheduleEntryType;
        entry.dateFrom = parseDate(data.dateFrom);
        entry.dateTo = parseDate(data.dateTo);
        entry.startTime = data.startTime;
        entry.endTime = data.endTime;
        entry.note = data.note || null;
        entry.status = ScheduleStatus.PENDING;
        entry.createdBy = data.actorId || null;
        await this.em.persistAndFlush(entry);
        return entry;
    }

    @CreateRequestContext()
    async findAll(query: FindAllSchedulesRequest): Promise<{ data: WSchedule[]; overallCount: number; page: number; limit: number }> {
        const page = query.page || 1;
        const limit = query.limit || 20;
        const where: any = {};
        if (query.userId) where.userId = query.userId;
        if (query.type) where.type = query.type;
        if (query.status) where.status = query.status.includes(",") ? { $in: query.status.split(",") } : query.status;
        // Overlap filter: entry.dateFrom <= query.dateTo AND entry.dateTo >= query.dateFrom
        if (query.dateFrom) where.dateTo = { $gte: parseDate(query.dateFrom) };
        if (query.dateTo) where.dateFrom = { $lte: parseDate(query.dateTo) };
        const orderBy: any = {};
        if (query.sortBy) orderBy[query.sortBy] = query.sortOrder === 'desc' ? 'DESC' : 'ASC';
        else orderBy.dateFrom = 'DESC';

        const [data, overallCount] = await this.em.findAndCount(WSchedule, where, {
            orderBy,
            limit,
            offset: (page - 1) * limit,
        });
        return { data, overallCount, page, limit };
    }

    @CreateRequestContext()
    async findOne(id: string): Promise<WSchedule> {
        return this.em.findOneOrFail(WSchedule, { id });
    }

    @CreateRequestContext()
    async update(id: string, data: UpdateScheduleRequest): Promise<WSchedule> {
        const entry = await this.em.findOneOrFail(WSchedule, { id });
        if (data.type !== undefined) entry.type = data.type as ScheduleEntryType;
        if (data.dateFrom !== undefined && data.dateFrom !== '') entry.dateFrom = parseDate(data.dateFrom);
        if (data.dateTo !== undefined && data.dateTo !== '') entry.dateTo = parseDate(data.dateTo);
        if (data.startTime !== undefined && data.startTime !== '') entry.startTime = data.startTime;
        if (data.endTime !== undefined && data.endTime !== '') entry.endTime = data.endTime;
        if (data.status !== undefined && data.status !== '') entry.status = data.status as ScheduleStatus;
        if (data.note !== undefined) entry.note = data.note || null;
        await this.em.flush();
        return entry;
    }

    @CreateRequestContext()
    async delete(id: string): Promise<{ id: string; userId: string; type: ScheduleEntryType }> {
        const entry = await this.em.findOneOrFail(WSchedule, { id });
        const snapshot = { id: entry.id, userId: entry.userId, type: entry.type };
        await this.em.removeAndFlush(entry);
        return snapshot;
    }

    @CreateRequestContext()
    async approve(id: string, approvedBy: string): Promise<WSchedule> {
        const entry = await this.em.findOneOrFail(WSchedule, { id });
        entry.status = ScheduleStatus.APPROVED;
        entry.approvedBy = approvedBy;
        await this.em.flush();
        return entry;
    }

    @CreateRequestContext()
    async reject(id: string, approvedBy: string): Promise<WSchedule> {
        const entry = await this.em.findOneOrFail(WSchedule, { id });
        entry.status = ScheduleStatus.REJECTED;
        entry.approvedBy = approvedBy;
        await this.em.flush();
        return entry;
    }

    @CreateRequestContext()
    async recordOvertime(userId: string, date: Date, startTime: string, endTime: string, requestId: string): Promise<WSchedule> {
        const entry = new WSchedule();
        entry.userId = userId;
        entry.type = ScheduleEntryType.OVERTIME;
        entry.dateFrom = date;
        entry.dateTo = date;
        entry.startTime = startTime;
        entry.endTime = endTime;
        entry.status = ScheduleStatus.APPROVED;
        entry.autoGenerated = true;
        entry.note = `Авто: заявка #${requestId.slice(0, 8)}`;
        await this.em.persistAndFlush(entry);
        return entry;
    }

    @CreateRequestContext()
    async recordExtraDay(userId: string, date: Date, startTime: string, endTime: string, requestId: string): Promise<WSchedule> {
        const existing = await this.em.findOne(WSchedule, {
            userId,
            type: ScheduleEntryType.EXTRA_DAY,
            dateFrom: date,
            dateTo: date,
        });
        if (existing) return existing;

        const entry = new WSchedule();
        entry.userId = userId;
        entry.type = ScheduleEntryType.EXTRA_DAY;
        entry.dateFrom = date;
        entry.dateTo = date;
        entry.startTime = startTime;
        entry.endTime = endTime;
        entry.status = ScheduleStatus.APPROVED;
        entry.autoGenerated = true;
        entry.note = `Авто: назначение на выходной, заявка #${requestId.slice(0, 8)}`;
        await this.em.persistAndFlush(entry);
        return entry;
    }

    // ── Schedule validation API (consumed by repair-request service) ──

    /**
     * Returns the first APPROVED vacation/sick-leave entry covering today, or null.
     * An APPROVED EXTRA_DAY covering today overrides the block — managers can propose
     * an extra work day during a repairer's vacation, and once the repairer accepts,
     * the repairer can be assigned to requests for that specific day.
     */
    @CreateRequestContext()
    async findBlockingToday(userId: string, timezone?: string): Promise<WSchedule | null> {
        const { todayStart: today } = getLocalNow(timezone ?? DEFAULT_TIMEZONE);
        const blocking = await this.em.findOne(WSchedule, {
            userId,
            status: ScheduleStatus.APPROVED,
            type: { $in: [ScheduleEntryType.VACATION, ScheduleEntryType.SICK_LEAVE] },
            dateFrom: { $lte: today },
            dateTo: { $gte: today },
        });
        if (!blocking) return null;
        const override = await this.em.findOne(WSchedule, {
            userId,
            status: ScheduleStatus.APPROVED,
            type: ScheduleEntryType.EXTRA_DAY,
            dateFrom: { $lte: today },
            dateTo: { $gte: today },
        });
        return override ? null : blocking;
    }

    /**
     * Sum of APPROVED OVERTIME minutes booked for today (local tz).
     */
    @CreateRequestContext()
    async getTodayOvertimeMinutes(userId: string, timezone?: string): Promise<number> {
        const { todayStart, todayEnd } = getLocalNow(timezone ?? DEFAULT_TIMEZONE);
        const entries = await this.em.find(WSchedule, {
            userId,
            status: ScheduleStatus.APPROVED,
            type: ScheduleEntryType.OVERTIME,
            dateFrom: { $lte: todayEnd },
            dateTo: { $gte: todayStart },
        });
        let total = 0;
        for (const entry of entries) {
            const [sh, sm] = entry.startTime.split(':').map(Number);
            const [eh, em] = entry.endTime.split(':').map(Number);
            total += Math.max(0, (eh * 60 + em) - (sh * 60 + sm));
        }
        return total;
    }

    /**
     * Comprehensive schedule guard — throws if repairer cannot work right now.
     * Checks: vacation/sick, rest day, before start, after end, overtime cap.
     * (Concurrent-active-requests cap stays in the repair-request service since
     *  it counts RepairRequest rows, not schedule rows.)
     */
    async assertScheduleAllows(repairer: RepairerScheduleCtx, action: string): Promise<void> {
        const tz = repairer.timezone ?? DEFAULT_TIMEZONE;
        const { nowTime, todayStart, todayEnd } = getLocalNow(tz);
        const dateForPattern = getLocalDateAsUtc(tz);

        // 1. Vacation / sick leave
        const blocking = await this.findBlockingToday(repairer.userId, tz);
        if (blocking) {
            const label = blocking.type === ScheduleEntryType.VACATION ? 'отпуске' : 'больничном';
            throw AppErrors.badRequest(`Мастер на ${label}. ${action} невозможно`);
        }

        // 2. Resolve pattern
        const slot = await this.patternService.resolveSlotForDate(repairer.userId, dateForPattern);

        if (slot) {
            if (!slot.work) {
                throw AppErrors.badRequest(`Сегодня выходной день мастера. ${action} невозможно`);
            }

            // 3. Before schedule start
            if (nowTime < slot.startTime) {
                throw AppErrors.badRequest(`Рабочий день ещё не начался (начало в ${slot.startTime}). ${action} невозможно`);
            }

            // 4. After schedule end (check overrides)
            if (nowTime > slot.endTime) {
                const overrides = await this.em.find(WSchedule, {
                    userId: repairer.userId,
                    status: ScheduleStatus.APPROVED,
                    type: { $in: [ScheduleEntryType.OVERTIME, ScheduleEntryType.EXTRA_DAY] },
                    dateFrom: { $lte: todayEnd },
                    dateTo: { $gte: todayStart },
                });
                const extended = overrides.some(e => e.endTime && nowTime <= e.endTime);
                if (!extended) {
                    throw AppErrors.badRequest(`Рабочий день завершён (окончание в ${slot.endTime}). ${action} невозможно`);
                }
            }
        }

        // 5. Daily overtime cap
        const overtimeMinutesToday = await this.getTodayOvertimeMinutes(repairer.userId, tz);
        if (overtimeMinutesToday >= MAX_OVERTIME_MINUTES_PER_DAY) {
            throw AppErrors.badRequest(`Превышен лимит переработки (${MAX_OVERTIME_MINUTES_PER_DAY / 60}ч/день). ${action} невозможно`);
        }
    }

    /**
     * Check remaining schedule time — throws if less than MIN_REMAINING_SCHEDULE_MINUTES left.
     * Used for assignment to avoid assigning work that can't be started.
     */
    async assertEnoughScheduleTime(repairer: RepairerScheduleCtx): Promise<void> {
        const tz = repairer.timezone ?? DEFAULT_TIMEZONE;
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
    }

    /**
     * If the repairer's assignment falls on a non-work day (or outside their pattern),
     * auto-create an APPROVED EXTRA_DAY entry so the day becomes billable / reportable.
     * Skips if a vacation/sick block is in effect (blocked time isn't bonus work).
     */
    async ensureExtraDayIfOff(
        repairer: RepairerScheduleCtx,
        requestId: string,
        assignedAt?: Date,
    ): Promise<void> {
        const tz = repairer.timezone ?? DEFAULT_TIMEZONE;
        const date = assignedAt ?? new Date();
        const dateForPattern = getLocalDateAsUtc(tz);
        const blocking = await this.findBlockingToday(repairer.userId, tz);
        if (blocking) return;
        const slot = await this.patternService.resolveSlotForDate(repairer.userId, dateForPattern);
        if (slot && slot.work) return;
        const start = slot?.startTime || '09:00';
        const end = slot?.endTime || '18:00';
        await this.recordExtraDay(repairer.userId, date, start, end, requestId);
    }

    /**
     * For `confirmSchedulePresence`: blocks vacation/sick, today-rest, and enforces daily overtime cap.
     * Does not enforce start/end time boundaries since the caller is explicitly confirming presence
     * past the scheduled end.
     */
    async assertPresenceAllowed(repairer: RepairerScheduleCtx, action: string): Promise<void> {
        const tz = repairer.timezone ?? DEFAULT_TIMEZONE;
        const blocking = await this.findBlockingToday(repairer.userId, tz);
        if (blocking) {
            const label = blocking.type === ScheduleEntryType.VACATION ? 'отпуске' : 'больничном';
            throw AppErrors.badRequest(`Мастер на ${label}. ${action} невозможно`);
        }
        const dateForPattern = getLocalDateAsUtc(tz);
        const slot = await this.patternService.resolveSlotForDate(repairer.userId, dateForPattern);
        if (slot && !slot.work) {
            throw AppErrors.badRequest(`Сегодня выходной день. ${action} невозможно`);
        }
        const overtimeMinutes = await this.getTodayOvertimeMinutes(repairer.userId, tz);
        if (overtimeMinutes >= MAX_OVERTIME_MINUTES_PER_DAY) {
            throw AppErrors.badRequest(
                `Превышен лимит переработки (${MAX_OVERTIME_MINUTES_PER_DAY / 60}ч/день). ${action} невозможно`,
            );
        }
    }
}
