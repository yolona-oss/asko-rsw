import { Injectable } from '@nestjs/common';
import { CreateRequestContext, EntityManager } from '@mikro-orm/postgresql';
import { WSchedulePattern } from '../entities/wschedule-pattern.entity';
import { WSchedulePatternHistory } from '../entities/wschedule-pattern-history.entity';
import { ScheduleStatus } from '../entities/schedule-status.enum';
import { UserStatusHistory } from 'modules/repairer/entities/user-status-history.entity';
import { Repairer } from 'modules/repairer/entities/repairer.entity';
import { VacationService } from './vacation.service';
import { SickLeaveService } from './sick-leave.service';
import { OvertimeService } from './overtime.service';
import { ScheduleOverrideService } from './schedule-override.service';
import { WSchedulePatternHistoryService } from './wschedule-pattern-history.service';
import { WSchedulePatternService, ResolvedSlot } from './wschedule-pattern.service';

const MS_PER_DAY = 86_400_000;
const MAX_REPORT_DAYS = 365;

function timeToMinutes(start: string, end: string): number {
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    return Math.max(0, (eh * 60 + em) - (sh * 60 + sm));
}

export interface ScheduleAggregateReport {
    userId: string;
    dateFrom: string;
    dateTo: string;
    isCurrentlyActive: boolean;
    totalDays: number;
    activeDays: number;
    inactiveDays: number;
    workDays: number;
    restDays: number;
    noPatternDays: number;
    vacationDays: number;
    sickLeaveDays: number;
    overtimeCount: number;
    overtimeTotalMinutes: number;
    extraDayCount: number;
    patternRevisions: number;
}

@Injectable()
export class WScheduleReportService {
    constructor(
        private readonly em: EntityManager,
        private readonly vacationService: VacationService,
        private readonly sickLeaveService: SickLeaveService,
        private readonly overtimeService: OvertimeService,
        private readonly overrideService: ScheduleOverrideService,
        private readonly historyService: WSchedulePatternHistoryService,
        private readonly patternService: WSchedulePatternService,
    ) {}

    @CreateRequestContext()
    async generateReport(userId: string, dateFrom: Date, dateTo: Date): Promise<ScheduleAggregateReport> {
        const totalDays = Math.floor((dateTo.getTime() - dateFrom.getTime()) / MS_PER_DAY) + 1;
        if (totalDays > MAX_REPORT_DAYS) throw new Error(`Report range cannot exceed ${MAX_REPORT_DAYS} days`);
        if (totalDays < 1) throw new Error('dateFrom must be before dateTo');

        // 1. Current repairer status
        const repairer = await this.em.findOne(Repairer, { userId });
        const isCurrentlyActive = repairer?.isActive ?? true;

        // 2. Status history timeline
        const statusHistory = await this.em.find(
            UserStatusHistory,
            { userId, changedAt: { $lte: dateTo } },
            { orderBy: { changedAt: 'ASC' } },
        );

        // 3. Pattern history + current live pattern
        const patternHistory = await this.em.find(
            WSchedulePatternHistory,
            { userId, effectiveFrom: { $lte: dateTo } },
            { orderBy: { effectiveFrom: 'ASC' } },
        );
        const livePattern = await this.em.findOne(WSchedulePattern, { userId });

        // 4. Schedule entries overlapping the range (all 4 types in parallel)
        const [vacations, sickLeaves, overtimes, overrides] = await Promise.all([
            this.vacationService.findInRange(userId, dateFrom, dateTo),
            this.sickLeaveService.findInRange(userId, dateFrom, dateTo),
            this.overtimeService.findInRange(userId, dateFrom, dateTo),
            this.overrideService.findInRange(userId, dateFrom, dateTo),
        ]);

        // 5. Count pattern revisions in range
        const patternRevisions = await this.em.count(WSchedulePatternHistory, {
            userId,
            changedAt: { $gte: dateFrom, $lte: dateTo },
        });

        // 6. Day-by-day iteration
        let activeDays = 0;
        let inactiveDays = 0;
        let workDays = 0;
        let restDays = 0;
        let noPatternDays = 0;

        for (let i = 0; i < totalDays; i++) {
            const day = new Date(dateFrom.getTime() + i * MS_PER_DAY);

            const active = this.isActiveOnDate(statusHistory, day);
            if (!active) {
                inactiveDays++;
                continue;
            }
            activeDays++;

            const slot = this.resolveSlotForDate(patternHistory, livePattern, day);
            if (!slot) {
                noPatternDays++;
                continue;
            }
            if (slot.work) {
                workDays++;
            } else {
                restDays++;
            }
        }

        // 7. Aggregate schedule entries
        let vacationDays = 0;
        for (const v of vacations) {
            const entryFrom = v.dateFrom > dateFrom ? v.dateFrom : dateFrom;
            const entryTo = v.dateTo < dateTo ? v.dateTo : dateTo;
            vacationDays += Math.floor((entryTo.getTime() - entryFrom.getTime()) / MS_PER_DAY) + 1;
        }

        let sickLeaveDays = 0;
        for (const s of sickLeaves) {
            const entryFrom = s.dateFrom > dateFrom ? s.dateFrom : dateFrom;
            const entryTo = s.dateTo < dateTo ? s.dateTo : dateTo;
            sickLeaveDays += Math.floor((entryTo.getTime() - entryFrom.getTime()) / MS_PER_DAY) + 1;
        }

        let overtimeCount = overtimes.length;
        let overtimeTotalMinutes = 0;
        for (const o of overtimes) {
            overtimeTotalMinutes += timeToMinutes(o.startTime, o.endTime);
        }

        const extraDayCount = overrides.length;

        return {
            userId,
            dateFrom: dateFrom.toISOString().slice(0, 10),
            dateTo: dateTo.toISOString().slice(0, 10),
            isCurrentlyActive,
            totalDays,
            activeDays,
            inactiveDays,
            workDays,
            restDays,
            noPatternDays,
            vacationDays,
            sickLeaveDays,
            overtimeCount,
            overtimeTotalMinutes,
            extraDayCount,
            patternRevisions,
        };
    }

    private isActiveOnDate(history: UserStatusHistory[], date: Date): boolean {
        let active = true;
        for (const entry of history) {
            if (entry.changedAt <= date) {
                active = entry.isActive;
            } else {
                break;
            }
        }
        return active;
    }

    private resolveSlotForDate(
        history: WSchedulePatternHistory[],
        livePattern: WSchedulePattern | null,
        date: Date,
    ): ResolvedSlot | null {
        let activeVersion: { cycleLength: number; anchorDate: Date; slots: any[]; defaultStartTime: string; defaultEndTime: string; status: string } | null = null;

        for (let i = history.length - 1; i >= 0; i--) {
            if (history[i].effectiveFrom <= date) {
                activeVersion = history[i];
                break;
            }
        }

        if (livePattern && livePattern.status === ScheduleStatus.APPROVED) {
            if (!activeVersion || livePattern.updatedAt >= (activeVersion as WSchedulePatternHistory).changedAt) {
                return this.patternService.resolveFromPattern(livePattern, date);
            }
        }

        if (!activeVersion || activeVersion.status !== ScheduleStatus.APPROVED) return null;

        return this.resolveFromHistoryEntry(activeVersion, date);
    }

    private resolveFromHistoryEntry(
        entry: { cycleLength: number; anchorDate: Date; slots: any[]; defaultStartTime: string; defaultEndTime: string },
        date: Date,
    ): ResolvedSlot {
        const dayStart = (d: Date) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
        const diffDays = Math.floor((dayStart(date).getTime() - dayStart(entry.anchorDate).getTime()) / MS_PER_DAY);
        const len = entry.cycleLength;
        const position = ((diffDays % len) + len) % len;
        const slot = entry.slots[position] ?? { work: false };
        return {
            work: !!slot.work,
            startTime: slot.startTime || entry.defaultStartTime,
            endTime: slot.endTime || entry.defaultEndTime,
        };
    }
}
