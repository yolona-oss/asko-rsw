import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { grpcCall } from 'common/grpc';

import type {
    ScheduleServiceClient,
    ScheduleResponse,
    ScheduleListResponse,
    ScheduleOccurrencesResponse,
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

    createSchedule(date: string, startTime: string, endTime: string, repeatRule?: string): Promise<ScheduleResponse> {
        return grpcCall(this.scheduleService.createSchedule({
            date,
            startTime,
            endTime,
            repeatRule: repeatRule ?? '',
        }));
    }

    findAll(): Promise<ScheduleListResponse> {
        return grpcCall(this.scheduleService.findAllSchedules({}));
    }

    findById(id: string): Promise<ScheduleResponse> {
        return grpcCall(this.scheduleService.findScheduleById({ id }));
    }

    delete(id: string): Promise<ScheduleEmptyResponse> {
        return grpcCall(this.scheduleService.deleteSchedule({ id }));
    }

    getOccurrences(id: string, count?: number): Promise<ScheduleOccurrencesResponse> {
        return grpcCall(this.scheduleService.getOccurrences({ id, count: count ?? 5 }));
    }
}
