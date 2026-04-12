import { Injectable } from '@nestjs/common';
import { CreateRequestContext, EntityManager } from '@mikro-orm/postgresql';
import { WSchedulePatternHistory, PatternChangeType } from 'entities/wschedule-pattern-history.entity';
import { WSchedulePattern } from 'entities/wschedule-pattern.entity';
import { Repairer } from 'entities/repairer.entity';

@Injectable()
export class WSchedulePatternHistoryService {
    constructor(private readonly em: EntityManager) {}

    /**
     * Creates a history snapshot from the current pattern state.
     * Does NOT flush — the caller is responsible for flushing the shared unit-of-work.
     */
    async snapshot(
        em: EntityManager,
        pattern: WSchedulePattern,
        changeType: PatternChangeType,
        changedBy: string | null,
    ): Promise<void> {
        const repairer = await em.findOne(Repairer, { userId: pattern.userId });
        const entry = new WSchedulePatternHistory();
        entry.patternId = pattern.id;
        entry.userId = pattern.userId;
        entry.cycleLength = pattern.cycleLength;
        entry.anchorDate = new Date(pattern.anchorDate);
        entry.defaultStartTime = pattern.defaultStartTime;
        entry.defaultEndTime = pattern.defaultEndTime;
        entry.slots = structuredClone(pattern.slots);
        entry.status = pattern.status;
        entry.pendingData = pattern.pendingData ? structuredClone(pattern.pendingData) : null;
        entry.changeType = changeType;
        entry.changedBy = changedBy;
        entry.isActive = repairer?.isActive ?? true;
        entry.effectiveFrom = pattern.updatedAt;
        entry.changedAt = new Date();
        em.persist(entry);
    }

    @CreateRequestContext()
    async getHistory(
        userId: string,
        opts?: { dateFrom?: string; dateTo?: string; page?: number; limit?: number },
    ): Promise<{ data: WSchedulePatternHistory[]; overallCount: number; page: number; limit: number }> {
        const page = opts?.page || 1;
        const limit = opts?.limit || 20;
        const where: any = { userId };
        if (opts?.dateFrom) where.changedAt = { ...where.changedAt, $gte: new Date(opts.dateFrom) };
        if (opts?.dateTo) where.changedAt = { ...where.changedAt, $lte: new Date(opts.dateTo) };

        const [data, overallCount] = await this.em.findAndCount(WSchedulePatternHistory, where, {
            orderBy: { changedAt: 'DESC' },
            limit,
            offset: (page - 1) * limit,
        });
        return { data, overallCount, page, limit };
    }

    @CreateRequestContext()
    async getPatternAtDate(userId: string, date: Date): Promise<WSchedulePatternHistory | null> {
        return this.em.findOne(
            WSchedulePatternHistory,
            { userId, effectiveFrom: { $lte: date } },
            { orderBy: { effectiveFrom: 'DESC' } },
        );
    }

    /**
     * Fetch all history rows needed for report date-range resolution.
     * Returns all versions whose effectiveFrom <= dateTo, ordered ASC.
     */
    @CreateRequestContext()
    async getHistoryForRange(userId: string, dateTo: Date): Promise<WSchedulePatternHistory[]> {
        return this.em.find(
            WSchedulePatternHistory,
            { userId, effectiveFrom: { $lte: dateTo } },
            { orderBy: { effectiveFrom: 'ASC' } },
        );
    }

    @CreateRequestContext()
    async countRevisionsInRange(userId: string, dateFrom: Date, dateTo: Date): Promise<number> {
        return this.em.count(WSchedulePatternHistory, {
            userId,
            changedAt: { $gte: dateFrom, $lte: dateTo },
        });
    }
}
