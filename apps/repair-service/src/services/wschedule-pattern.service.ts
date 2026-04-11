import { Injectable } from '@nestjs/common';
import { CreateRequestContext, EntityManager } from '@mikro-orm/postgresql';
import { WSchedulePattern, PatternSlotData } from 'entities/wschedule-pattern.entity';
import type { UpsertPatternRequest } from '@asko/proto';

const MS_PER_DAY = 86_400_000;

export interface ResolvedSlot {
    work: boolean;
    startTime: string;
    endTime: string;
}

@Injectable()
export class WSchedulePatternService {
    constructor(private readonly em: EntityManager) {}

    @CreateRequestContext()
    async get(userId: string): Promise<WSchedulePattern | null> {
        return this.em.findOne(WSchedulePattern, { userId });
    }

    @CreateRequestContext()
    async getMany(userIds: string[]): Promise<WSchedulePattern[]> {
        if (userIds.length === 0) return [];
        return this.em.find(WSchedulePattern, { userId: { $in: userIds } });
    }

    @CreateRequestContext()
    async upsert(data: UpsertPatternRequest): Promise<WSchedulePattern> {
        this.validate(data);
        let pattern = await this.em.findOne(WSchedulePattern, { userId: data.userId });
        if (!pattern) {
            pattern = new WSchedulePattern();
            pattern.userId = data.userId;
        }
        pattern.cycleLength = data.cycleLength;
        pattern.anchorDate = new Date(data.anchorDate);
        pattern.defaultStartTime = data.defaultStartTime;
        pattern.defaultEndTime = data.defaultEndTime;
        pattern.slots = data.slots.map((s) => ({
            work: !!s.work,
            startTime: s.startTime || null,
            endTime: s.endTime || null,
        }));
        await this.em.persistAndFlush(pattern);
        return pattern;
    }

    @CreateRequestContext()
    async delete(userId: string): Promise<void> {
        const pattern = await this.em.findOne(WSchedulePattern, { userId });
        if (pattern) await this.em.removeAndFlush(pattern);
    }

    /**
     * Resolve a slot for a specific calendar date (no transaction needed — uses in-memory pattern).
     * Returns null if the user has no pattern. If the resolved slot is a rest day, `work === false`.
     */
    async resolveSlotForDate(userId: string, date: Date): Promise<ResolvedSlot | null> {
        const pattern = await this.get(userId);
        if (!pattern) return null;
        return this.resolveFromPattern(pattern, date);
    }

    resolveFromPattern(pattern: WSchedulePattern, date: Date): ResolvedSlot {
        const diffDays = Math.floor((this.dayStart(date).getTime() - this.dayStart(pattern.anchorDate).getTime()) / MS_PER_DAY);
        const len = pattern.cycleLength;
        const position = ((diffDays % len) + len) % len;
        const slot = pattern.slots[position] ?? { work: false };
        return {
            work: !!slot.work,
            startTime: slot.startTime || pattern.defaultStartTime,
            endTime: slot.endTime || pattern.defaultEndTime,
        };
    }

    private dayStart(d: Date): Date {
        return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
    }

    private validate(data: UpsertPatternRequest): void {
        if (!data.userId) throw new Error('userId is required');
        if (!Number.isInteger(data.cycleLength) || data.cycleLength < 1 || data.cycleLength > 14) {
            throw new Error('cycleLength must be between 1 and 14');
        }
        if (!Array.isArray(data.slots) || data.slots.length !== data.cycleLength) {
            throw new Error('slots length must equal cycleLength');
        }
        if (!data.slots.some((s) => s.work)) {
            throw new Error('pattern must contain at least one work slot');
        }
        if (!/^\d{2}:\d{2}$/.test(data.defaultStartTime) || !/^\d{2}:\d{2}$/.test(data.defaultEndTime)) {
            throw new Error('default times must be HH:MM');
        }
        if (!data.anchorDate) throw new Error('anchorDate is required');
    }
}
