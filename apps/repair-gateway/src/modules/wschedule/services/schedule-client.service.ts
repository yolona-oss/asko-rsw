import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { grpcCall } from '@asko/gateway-common';

import type {
    ScheduleServiceClient,
    SchedulePatternServiceClient,
    CreateScheduleRequest,
    UpdateScheduleRequest,
    FindAllSchedulesRequest,
    ScheduleResponse,
    SchedulePaginatedResponse,
    ScheduleEmptyResponse,
    UpsertPatternRequest,
    PatternResponse,
    PatternListResponse,
    GetPatternHistoryRequest,
    PatternHistoryResponse,
    GetScheduleReportRequest,
    ScheduleAggregateReportResponse,
} from '@asko/proto';

@Injectable()
export class ScheduleClientService implements OnModuleInit {
    private scheduleService!: ScheduleServiceClient;
    private patternService!: SchedulePatternServiceClient;

    constructor(
        @Inject('REPAIR_PACKAGE') private readonly client: ClientGrpc,
    ) {}

    onModuleInit() {
        this.scheduleService = this.client.getService<ScheduleServiceClient>('ScheduleService');
        this.patternService = this.client.getService<SchedulePatternServiceClient>('SchedulePatternService');
    }

    create(data: CreateScheduleRequest): Promise<ScheduleResponse> {
        return grpcCall(this.scheduleService.createSchedule(data));
    }

    update(data: UpdateScheduleRequest): Promise<ScheduleResponse> {
        return grpcCall(this.scheduleService.updateSchedule(data));
    }

    findAll(data: FindAllSchedulesRequest): Promise<SchedulePaginatedResponse> {
        return grpcCall(this.scheduleService.findAllSchedules(data));
    }

    findById(id: string): Promise<ScheduleResponse> {
        return grpcCall(this.scheduleService.findScheduleById({ id }));
    }

    delete(id: string, actorId?: string): Promise<ScheduleEmptyResponse> {
        return grpcCall(this.scheduleService.deleteSchedule({ id, actorId }));
    }

    approve(id: string, approvedBy: string): Promise<ScheduleResponse> {
        return grpcCall(this.scheduleService.approveSchedule({ id, approvedBy }));
    }

    reject(id: string, approvedBy: string): Promise<ScheduleResponse> {
        return grpcCall(this.scheduleService.rejectSchedule({ id, approvedBy }));
    }

    patternGet(userId: string): Promise<PatternResponse> {
        return grpcCall(this.patternService.getPattern({ userId }));
    }

    patternUpsert(data: UpsertPatternRequest): Promise<PatternResponse> {
        return grpcCall(this.patternService.upsertPattern(data));
    }

    patternDelete(userId: string, actorId?: string): Promise<ScheduleEmptyResponse> {
        return grpcCall(this.patternService.deletePattern({ userId, actorId }));
    }

    patternGetMany(userIds: string[]): Promise<PatternListResponse> {
        return grpcCall(this.patternService.getManyPatterns({ userIds }));
    }

    patternApprove(userId: string, approvedBy: string): Promise<PatternResponse> {
        return grpcCall(this.patternService.approvePattern({ userId, approvedBy }));
    }

    patternReject(userId: string, approvedBy: string): Promise<PatternResponse> {
        return grpcCall(this.patternService.rejectPattern({ userId, approvedBy }));
    }

    patternHistory(data: GetPatternHistoryRequest): Promise<PatternHistoryResponse> {
        return grpcCall(this.patternService.getPatternHistory(data));
    }

    scheduleReport(data: GetScheduleReportRequest): Promise<ScheduleAggregateReportResponse> {
        return grpcCall(this.patternService.getScheduleReport(data));
    }
}
