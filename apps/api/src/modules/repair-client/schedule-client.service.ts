import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { grpcCall } from 'common/grpc';

import type {
    ScheduleServiceClient,
    CreateScheduleRequest,
    UpdateScheduleRequest,
    FindAllSchedulesRequest,
    ScheduleResponse,
    SchedulePaginatedResponse,
    ScheduleListResponse,
    ScheduleEmptyResponse,
} from '@asko/proto';

@Injectable()
export class ScheduleClientService implements OnModuleInit {
    private scheduleService!: ScheduleServiceClient;

    constructor(
        @Inject('REPAIR_PACKAGE') private readonly client: ClientGrpc,
    ) {}

    onModuleInit() {
        this.scheduleService = this.client.getService<ScheduleServiceClient>('ScheduleService');
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

    delete(id: string): Promise<ScheduleEmptyResponse> {
        return grpcCall(this.scheduleService.deleteSchedule({ id }));
    }

    approve(id: string, approvedBy: string): Promise<ScheduleResponse> {
        return grpcCall(this.scheduleService.approveSchedule({ id, approvedBy }));
    }

    reject(id: string, approvedBy: string): Promise<ScheduleResponse> {
        return grpcCall(this.scheduleService.rejectSchedule({ id, approvedBy }));
    }

    getWeeklyTemplate(userId: string): Promise<ScheduleListResponse> {
        return grpcCall(this.scheduleService.getWeeklyTemplate({ userId }));
    }
}
