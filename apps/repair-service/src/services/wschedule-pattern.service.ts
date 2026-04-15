import { Injectable } from '@nestjs/common';
import { CreateRequestContext, EntityManager } from '@mikro-orm/postgresql';
import { WSchedulePattern, PatternSlotData, PatternPendingData } from 'entities/wschedule-pattern.entity';
import { PatternChangeType } from 'entities/wschedule-pattern-history.entity';
import { ScheduleStatus } from 'entities/wschedule.entity';
import { RepairRequest } from 'entities/repair-request.entity';
import { RepairRequestStatus } from '@asko/shared';
import { WSchedulePatternHistoryService } from './wschedule-pattern-history.service';
import type { UpsertPatternRequest } from '@asko/proto';

const MS_PER_DAY = 86_400_000;

export interface ResolvedSlot {
    work: boolean;
    startTime: string;
    endTime: string;
}

export interface PatternEventSummary {
    userId: string;
    actorId?: string | null;
    isFirstSubmission: boolean;
    wasStaged: boolean;
}

export interface PatternUpsertResult {
    pattern: WSchedulePattern;
    event: PatternEventSummary | null;
}

@Injectable()
export class WSchedulePatternService {
    constructor(
        private readonly em: EntityManager,
        private readonly historyService: WSchedulePatternHistoryService,
    ) {}

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
    async upsert(data: UpsertPatternRequest): Promise<PatternUpsertResult> {
        this.validate(data);
        const proposed = this.toPendingData(data);
        const existing = await this.em.findOne(WSchedulePattern, { userId: data.userId });
        const actorIsStaff = !!data.actorIsStaff;

        if (!existing) {
            // First-time submission. Always PENDING regardless of actor — no live pattern yet.
            const pattern = new WSchedulePattern();
            pattern.userId = data.userId;
            this.applyProposedToLive(pattern, proposed);
            if (actorIsStaff) {
                pattern.status = ScheduleStatus.APPROVED;
                pattern.approvedBy = data.actorId || null;
                pattern.approvedAt = new Date();
            } else {
                pattern.status = ScheduleStatus.PENDING;
                pattern.approvedBy = null;
                pattern.approvedAt = null;
            }
            pattern.pendingData = null;
            await this.em.persistAndFlush(pattern);
            return {
                pattern,
                event: {
                    userId: data.userId,
                    actorId: data.actorId || null,
                    isFirstSubmission: true,
                    wasStaged: !actorIsStaff,
                },
            };
        }

        if (actorIsStaff) {
            // Staff edits apply directly and clear any pending stash.
            await this.historyService.snapshot(this.em, existing, PatternChangeType.UPDATED, data.actorId || null);
            this.applyProposedToLive(existing, proposed);
            existing.status = ScheduleStatus.APPROVED;
            existing.approvedBy = data.actorId || null;
            existing.approvedAt = new Date();
            existing.pendingData = null;
            await this.em.persistAndFlush(existing);
            return { pattern: existing, event: null };
        }

        // Non-staff edits.
        if (existing.status !== ScheduleStatus.APPROVED) {
            // Row is still PENDING (or REJECTED) — there's no live version yet, so the
            // repairer is refining the original submission in place.
            await this.historyService.snapshot(this.em, existing, PatternChangeType.UPDATED, data.actorId || null);
            this.applyProposedToLive(existing, proposed);
            existing.status = ScheduleStatus.PENDING;
            existing.approvedBy = null;
            existing.approvedAt = null;
            existing.pendingData = null;
            await this.em.persistAndFlush(existing);
            return {
                pattern: existing,
                event: {
                    userId: data.userId,
                    actorId: data.actorId || null,
                    isFirstSubmission: false,
                    wasStaged: false,
                },
            };
        }

        // Approved row — stash the proposed edit so the live pattern keeps serving.
        await this.historyService.snapshot(this.em, existing, PatternChangeType.UPDATED, data.actorId || null);
        existing.pendingData = proposed;
        await this.em.persistAndFlush(existing);
        return {
            pattern: existing,
            event: {
                userId: data.userId,
                actorId: data.actorId || null,
                isFirstSubmission: false,
                wasStaged: true,
            },
        };
    }

    @CreateRequestContext()
    async approve(userId: string, approvedBy: string): Promise<WSchedulePattern> {
        const pattern = await this.em.findOne(WSchedulePattern, { userId });
        if (!pattern) throw new Error('Pattern not found');

        // If the new pattern would turn today into a rest day and there are active requests, block
        if (await this.hasActiveRepairRequests(userId)) {
            const tempPattern = { ...pattern } as WSchedulePattern;
            if (pattern.pendingData) {
                this.applyProposedToLive(tempPattern, pattern.pendingData);
            }
            const todaySlot = this.resolveFromPattern(tempPattern, new Date());
            if (todaySlot && !todaySlot.work) {
                throw new Error('Нельзя утвердить расписание: сегодня станет выходным, но у мастера есть активные заявки');
            }
        }

        await this.historyService.snapshot(this.em, pattern, PatternChangeType.APPROVED, approvedBy);
        if (pattern.pendingData) {
            this.applyProposedToLive(pattern, pattern.pendingData);
            pattern.pendingData = null;
        }
        pattern.status = ScheduleStatus.APPROVED;
        pattern.approvedBy = approvedBy;
        pattern.approvedAt = new Date();
        await this.em.persistAndFlush(pattern);
        return pattern;
    }

    @CreateRequestContext()
    async reject(userId: string, approvedBy: string): Promise<WSchedulePattern> {
        const pattern = await this.em.findOne(WSchedulePattern, { userId });
        if (!pattern) throw new Error('Pattern not found');

        await this.historyService.snapshot(this.em, pattern, PatternChangeType.REJECTED, approvedBy);
        if (pattern.pendingData) {
            // Reject the staged edit only — live approved pattern stays untouched.
            pattern.pendingData = null;
            pattern.approvedBy = approvedBy;
            pattern.approvedAt = new Date();
            await this.em.persistAndFlush(pattern);
            return pattern;
        }

        // Reject a first-time submission (or a row still sitting in PENDING).
        pattern.status = ScheduleStatus.REJECTED;
        pattern.approvedBy = approvedBy;
        pattern.approvedAt = new Date();
        await this.em.persistAndFlush(pattern);
        return pattern;
    }

    private async hasActiveRepairRequests(userId: string): Promise<boolean> {
        const activeStatuses = [
            RepairRequestStatus.ASSIGNED,
            RepairRequestStatus.ACCEPTED,
            RepairRequestStatus.EN_ROUTE,
            RepairRequestStatus.IN_PROGRESS,
            RepairRequestStatus.AWAITING_COMPLETION,
        ];
        const count = await this.em.count(RepairRequest, {
            repairer: { userId },
            status: { $in: activeStatuses },
        });
        return count > 0;
    }

    @CreateRequestContext()
    async delete(userId: string): Promise<{ id: string; userId: string } | null> {
        const pattern = await this.em.findOne(WSchedulePattern, { userId });
        if (!pattern) return null;

        if (await this.hasActiveRepairRequests(userId)) {
            throw new Error('Нельзя удалить расписание: у мастера есть активные заявки');
        }

        await this.historyService.snapshot(this.em, pattern, PatternChangeType.DELETED, null);
        await this.em.flush();
        const result = { id: pattern.id, userId: pattern.userId };
        await this.em.removeAndFlush(pattern);
        return result;
    }

    /**
     * Resolve a slot for a specific calendar date (no transaction needed — uses in-memory pattern).
     * Returns null if the user has no *approved* live pattern. Pending-only rows are ignored so
     * the repairer's real work schedule only reflects confirmed cycles.
     */
    async resolveSlotForDate(userId: string, date: Date): Promise<ResolvedSlot | null> {
        const pattern = await this.get(userId);
        if (!pattern || pattern.status !== ScheduleStatus.APPROVED) return null;
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

    private applyProposedToLive(pattern: WSchedulePattern, data: PatternPendingData): void {
        pattern.cycleLength = data.cycleLength;
        pattern.anchorDate = new Date(data.anchorDate);
        pattern.defaultStartTime = data.defaultStartTime;
        pattern.defaultEndTime = data.defaultEndTime;
        pattern.slots = data.slots.map((s) => ({
            work: !!s.work,
            startTime: s.startTime || null,
            endTime: s.endTime || null,
        }));
    }

    private toPendingData(data: UpsertPatternRequest): PatternPendingData {
        return {
            cycleLength: data.cycleLength,
            anchorDate: data.anchorDate,
            defaultStartTime: data.defaultStartTime,
            defaultEndTime: data.defaultEndTime,
            slots: data.slots.map((s) => ({
                work: !!s.work,
                startTime: s.startTime || null,
                endTime: s.endTime || null,
            })),
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
