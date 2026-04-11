import { Controller } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { WSchedulePatternService } from 'services/wschedule-pattern.service';
import type { WSchedulePattern } from 'entities/wschedule-pattern.entity';
import type {
    GetPatternRequest,
    UpsertPatternRequest,
    DeletePatternRequest,
    GetManyPatternsRequest,
    PatternResponse,
    PatternListResponse,
    PatternRecord,
    ScheduleEmptyResponse,
} from '@asko/proto';

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
    };
}

@Controller()
export class SchedulePatternGrpcController {
    constructor(private readonly patternService: WSchedulePatternService) {}

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
            const pattern = await this.patternService.upsert(data);
            return { pattern: toRecord(pattern) };
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
            await this.patternService.delete(data.userId);
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
}
