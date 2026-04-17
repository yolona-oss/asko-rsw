import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { grpcCall } from '@asko/gateway-common';

import type {
    ScheduleServiceClient,
    SchedulePatternServiceClient,
    // Vacation
    CreateVacationRequest, UpdateVacationRequest, VacationResponse,
    // SickLeave
    CreateSickLeaveRequest, UpdateSickLeaveRequest, SickLeaveResponse,
    // Overtime
    CreateOvertimeRequest, UpdateOvertimeRequest, OvertimeResponse,
    // ScheduleOverride
    CreateScheduleOverrideRequest, UpdateScheduleOverrideRequest, ScheduleOverrideResponse,
    // Shared
    FindAllSchedulesRequest, SchedulePaginatedResponse,
    ScheduleEmptyResponse,
    // Pattern
    UpsertPatternRequest, PatternResponse, PatternListResponse,
    GetPatternHistoryRequest, PatternHistoryResponse,
    GetScheduleReportRequest, ScheduleAggregateReportResponse,
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

    // ── Vacation ──

    createVacation(data: CreateVacationRequest): Promise<VacationResponse> {
        return grpcCall(this.scheduleService.createVacation(data));
    }

    updateVacation(data: UpdateVacationRequest): Promise<VacationResponse> {
        return grpcCall(this.scheduleService.updateVacation(data));
    }

    findVacationById(id: string): Promise<VacationResponse> {
        return grpcCall(this.scheduleService.findVacationById({ id }));
    }

    deleteVacation(id: string, actorId?: string): Promise<ScheduleEmptyResponse> {
        return grpcCall(this.scheduleService.deleteVacation({ id, actorId }));
    }

    approveVacation(id: string, approvedBy: string): Promise<VacationResponse> {
        return grpcCall(this.scheduleService.approveVacation({ id, approvedBy }));
    }

    rejectVacation(id: string, approvedBy: string): Promise<VacationResponse> {
        return grpcCall(this.scheduleService.rejectVacation({ id, approvedBy }));
    }

    // ── SickLeave ──

    createSickLeave(data: CreateSickLeaveRequest): Promise<SickLeaveResponse> {
        return grpcCall(this.scheduleService.createSickLeave(data));
    }

    updateSickLeave(data: UpdateSickLeaveRequest): Promise<SickLeaveResponse> {
        return grpcCall(this.scheduleService.updateSickLeave(data));
    }

    findSickLeaveById(id: string): Promise<SickLeaveResponse> {
        return grpcCall(this.scheduleService.findSickLeaveById({ id }));
    }

    deleteSickLeave(id: string, actorId?: string): Promise<ScheduleEmptyResponse> {
        return grpcCall(this.scheduleService.deleteSickLeave({ id, actorId }));
    }

    approveSickLeave(id: string, approvedBy: string): Promise<SickLeaveResponse> {
        return grpcCall(this.scheduleService.approveSickLeave({ id, approvedBy }));
    }

    rejectSickLeave(id: string, approvedBy: string): Promise<SickLeaveResponse> {
        return grpcCall(this.scheduleService.rejectSickLeave({ id, approvedBy }));
    }

    // ── Overtime ──

    createOvertime(data: CreateOvertimeRequest): Promise<OvertimeResponse> {
        return grpcCall(this.scheduleService.createOvertime(data));
    }

    updateOvertime(data: UpdateOvertimeRequest): Promise<OvertimeResponse> {
        return grpcCall(this.scheduleService.updateOvertime(data));
    }

    findOvertimeById(id: string): Promise<OvertimeResponse> {
        return grpcCall(this.scheduleService.findOvertimeById({ id }));
    }

    deleteOvertime(id: string, actorId?: string): Promise<ScheduleEmptyResponse> {
        return grpcCall(this.scheduleService.deleteOvertime({ id, actorId }));
    }

    approveOvertime(id: string, approvedBy: string): Promise<OvertimeResponse> {
        return grpcCall(this.scheduleService.approveOvertime({ id, approvedBy }));
    }

    rejectOvertime(id: string, approvedBy: string): Promise<OvertimeResponse> {
        return grpcCall(this.scheduleService.rejectOvertime({ id, approvedBy }));
    }

    // ── ScheduleOverride ──

    createScheduleOverride(data: CreateScheduleOverrideRequest): Promise<ScheduleOverrideResponse> {
        return grpcCall(this.scheduleService.createScheduleOverride(data));
    }

    updateScheduleOverride(data: UpdateScheduleOverrideRequest): Promise<ScheduleOverrideResponse> {
        return grpcCall(this.scheduleService.updateScheduleOverride(data));
    }

    findScheduleOverrideById(id: string): Promise<ScheduleOverrideResponse> {
        return grpcCall(this.scheduleService.findScheduleOverrideById({ id }));
    }

    deleteScheduleOverride(id: string, actorId?: string): Promise<ScheduleEmptyResponse> {
        return grpcCall(this.scheduleService.deleteScheduleOverride({ id, actorId }));
    }

    approveScheduleOverride(id: string, approvedBy: string): Promise<ScheduleOverrideResponse> {
        return grpcCall(this.scheduleService.approveScheduleOverride({ id, approvedBy }));
    }

    rejectScheduleOverride(id: string, approvedBy: string): Promise<ScheduleOverrideResponse> {
        return grpcCall(this.scheduleService.rejectScheduleOverride({ id, approvedBy }));
    }

    // ── Unified ──

    findAll(data: FindAllSchedulesRequest): Promise<SchedulePaginatedResponse> {
        return grpcCall(this.scheduleService.findAllScheduleEntries(data));
    }

    // ── Pattern ──

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
