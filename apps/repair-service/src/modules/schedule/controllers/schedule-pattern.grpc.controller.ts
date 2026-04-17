import { Controller } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { WSchedulePatternService } from '../services/wschedule-pattern.service';
import { WSchedulePatternHistoryService } from '../services/wschedule-pattern-history.service';
import { WScheduleReportService } from '../services/wschedule-report.service';
import { ScheduleEventService, ScheduleEventType } from '../services/schedule-event.service';
import type { WSchedulePattern } from '../entities/wschedule-pattern.entity';
import type { WSchedulePatternHistory } from '../entities/wschedule-pattern-history.entity';
import type {
    GetPatternRequest,
    UpsertPatternRequest,
    DeletePatternRequest,
    GetManyPatternsRequest,
    PatternApproveRequest,
    PatternResponse,
    PatternListResponse,
    PatternRecord,
    PatternPending,
    PatternHistoryRecord,
    PatternHistoryResponse,
    GetPatternHistoryRequest,
    GetScheduleReportRequest,
    ScheduleAggregateReportResponse,
    ScheduleEmptyResponse,
} from '@asko/proto';

function toPendingProto(data: WSchedulePattern['pendingData']): PatternPending | undefined {
    if (!data) return undefined;
    return {
        cycleLength: data.cycleLength,
        anchorDate: data.anchorDate,
        defaultStartTime: data.defaultStartTime,
        defaultEndTime: data.defaultEndTime,
        slots: data.slots.map((s) => ({
            work: !!s.work,
            startTime: s.startTime || '',
            endTime: s.endTime || '',
        })),
    };
}

function toRecord(p: WSchedulePattern): PatternRecord {
    return {
        id: p.id,
        userId: p.userId,
        cycleLength: p.cycleLength,
        anchorDate: p.anchorDate.toISOString().split('T')[0],
        defaultStartTime: p.defaultStartTime,
        defaultEndTime: p.defaultEndTime,
        slots: p.slots.map((s) => ({
            work: !!s.work,
            startTime: s.startTime || '',
            endTime: s.endTime || '',
        })),
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
        status: p.status,
        approvedBy: p.approvedBy ?? '',
        approvedAt: p.approvedAt ? p.approvedAt.toISOString() : '',
        pendingData: toPendingProto(p.pendingData),
        hasPendingData: !!p.pendingData,
    };
}

function emptyRecord(userId: string): PatternRecord {
    return {
        id: '',
        userId,
        cycleLength: 0,
        anchorDate: '',
        defaultStartTime: '',
        defaultEndTime: '',
        slots: [],
        createdAt: '',
        updatedAt: '',
        status: '',
        approvedBy: '',
        approvedAt: '',
        hasPendingData: false,
    };
}

function toHistoryRecord(h: WSchedulePatternHistory): PatternHistoryRecord {
    return {
        id: h.id,
        patternId: h.patternId,
        userId: h.userId,
        cycleLength: h.cycleLength,
        anchorDate: h.anchorDate instanceof Date ? h.anchorDate.toISOString().split('T')[0] : String(h.anchorDate),
        defaultStartTime: h.defaultStartTime,
        defaultEndTime: h.defaultEndTime,
        slots: h.slots.map((s) => ({
            work: !!s.work,
            startTime: s.startTime || '',
            endTime: s.endTime || '',
        })),
        status: h.status,
        pendingData: h.pendingData ? {
            cycleLength: h.pendingData.cycleLength,
            anchorDate: h.pendingData.anchorDate,
            defaultStartTime: h.pendingData.defaultStartTime,
            defaultEndTime: h.pendingData.defaultEndTime,
            slots: h.pendingData.slots.map((s) => ({
                work: !!s.work,
                startTime: s.startTime || '',
                endTime: s.endTime || '',
            })),
        } : undefined,
        changeType: h.changeType,
        changedBy: h.changedBy ?? '',
        isActive: h.isActive,
        effectiveFrom: h.effectiveFrom.toISOString(),
        changedAt: h.changedAt.toISOString(),
    };
}

@Controller()
export class SchedulePatternGrpcController {
    constructor(
        private readonly patternService: WSchedulePatternService,
        private readonly historyService: WSchedulePatternHistoryService,
        private readonly reportService: WScheduleReportService,
        private readonly scheduleEventService: ScheduleEventService,
    ) {}

    @GrpcMethod('SchedulePatternService', 'GetPattern')
    async getPattern(data: GetPatternRequest): Promise<PatternResponse> {
        try {
            const pattern = await this.patternService.get(data.userId);
            return { pattern: pattern ? toRecord(pattern) : emptyRecord(data.userId) };
        } catch (e) {
            throw new RpcException({ code: status.INTERNAL, message: e instanceof Error ? e.message : 'Internal error' });
        }
    }

    @GrpcMethod('SchedulePatternService', 'UpsertPattern')
    async upsertPattern(data: UpsertPatternRequest): Promise<PatternResponse> {
        try {
            const result = await this.patternService.upsert(data);
            if (result.event) {
                await this.scheduleEventService.emitPattern({
                    type: result.event.isFirstSubmission
                        ? ScheduleEventType.SCHEDULE_PATTERN_CREATED
                        : ScheduleEventType.SCHEDULE_PATTERN_UPDATED,
                    patternId: result.pattern.id,
                    userId: result.pattern.userId,
                    actorId: result.event.actorId,
                    staged: result.event.wasStaged,
                    firstSubmission: result.event.isFirstSubmission,
                    timestamp: new Date(),
                });
            }
            return { pattern: toRecord(result.pattern) };
        } catch (e) {
            throw new RpcException({
                code: status.INVALID_ARGUMENT,
                message: e instanceof Error ? e.message : 'Invalid pattern',
            });
        }
    }

    @GrpcMethod('SchedulePatternService', 'DeletePattern')
    async deletePattern(data: DeletePatternRequest): Promise<ScheduleEmptyResponse> {
        try {
            const deleted = await this.patternService.delete(data.userId);
            if (deleted) {
                await this.scheduleEventService.emitPattern({
                    type: ScheduleEventType.SCHEDULE_PATTERN_DELETED,
                    patternId: deleted.id,
                    userId: deleted.userId,
                    actorId: data.actorId || null,
                    staged: false,
                    firstSubmission: false,
                    timestamp: new Date(),
                });
            }
            return {};
        } catch (e) {
            throw new RpcException({ code: status.INTERNAL, message: e instanceof Error ? e.message : 'Internal error' });
        }
    }

    @GrpcMethod('SchedulePatternService', 'GetManyPatterns')
    async getManyPatterns(data: GetManyPatternsRequest): Promise<PatternListResponse> {
        try {
            const patterns = await this.patternService.getMany(data.userIds ?? []);
            return { data: patterns.map(toRecord) };
        } catch (e) {
            throw new RpcException({ code: status.INTERNAL, message: e instanceof Error ? e.message : 'Internal error' });
        }
    }

    @GrpcMethod('SchedulePatternService', 'ApprovePattern')
    async approvePattern(data: PatternApproveRequest): Promise<PatternResponse> {
        try {
            const pattern = await this.patternService.approve(data.userId, data.approvedBy);
            await this.scheduleEventService.emitPattern({
                type: ScheduleEventType.SCHEDULE_PATTERN_APPROVED,
                patternId: pattern.id,
                userId: pattern.userId,
                actorId: data.approvedBy,
                staged: false,
                firstSubmission: false,
                timestamp: new Date(),
            });
            return { pattern: toRecord(pattern) };
        } catch (e) {
            throw new RpcException({ code: status.INTERNAL, message: e instanceof Error ? e.message : 'Internal error' });
        }
    }

    @GrpcMethod('SchedulePatternService', 'RejectPattern')
    async rejectPattern(data: PatternApproveRequest): Promise<PatternResponse> {
        try {
            const pattern = await this.patternService.reject(data.userId, data.approvedBy);
            await this.scheduleEventService.emitPattern({
                type: ScheduleEventType.SCHEDULE_PATTERN_REJECTED,
                patternId: pattern.id,
                userId: pattern.userId,
                actorId: data.approvedBy,
                staged: false,
                firstSubmission: false,
                timestamp: new Date(),
            });
            return { pattern: toRecord(pattern) };
        } catch (e) {
            throw new RpcException({ code: status.INTERNAL, message: e instanceof Error ? e.message : 'Internal error' });
        }
    }

    @GrpcMethod('SchedulePatternService', 'GetPatternHistory')
    async getPatternHistory(data: GetPatternHistoryRequest): Promise<PatternHistoryResponse> {
        try {
            const result = await this.historyService.getHistory(data.userId, {
                dateFrom: data.dateFrom || undefined,
                dateTo: data.dateTo || undefined,
                page: data.page || 1,
                limit: data.limit || 20,
            });
            return {
                data: result.data.map(toHistoryRecord),
                overallCount: result.overallCount,
                page: result.page,
                limit: result.limit,
            };
        } catch (e) {
            throw new RpcException({ code: status.INTERNAL, message: e instanceof Error ? e.message : 'Internal error' });
        }
    }

    @GrpcMethod('SchedulePatternService', 'GetScheduleReport')
    async getScheduleReport(data: GetScheduleReportRequest): Promise<ScheduleAggregateReportResponse> {
        try {
            if (!data.dateFrom || !data.dateTo) {
                throw new Error('dateFrom and dateTo are required');
            }
            return await this.reportService.generateReport(
                data.userId,
                new Date(data.dateFrom),
                new Date(data.dateTo),
            );
        } catch (e) {
            const code = e instanceof Error && e.message.includes('required') ? status.INVALID_ARGUMENT : status.INTERNAL;
            throw new RpcException({ code, message: e instanceof Error ? e.message : 'Internal error' });
        }
    }
}
