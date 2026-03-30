import { Controller } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { WScheduleService } from 'services/wschedule.service';
import type { WSchedule } from 'entities/wschedule.entity';
import type {
    CreateScheduleRequest,
    ScheduleFindByIdRequest,
    ScheduleDeleteRequest,
    ScheduleOccurrencesRequest,
} from '@asko/proto';

function scheduleToRecord(entity: WSchedule) {
    return {
        id: entity.id,
        startTime: entity.startTime?.toISOString() ?? '',
        endTime: entity.endTime?.toISOString() ?? '',
        repeatRule: entity.repeatRule ?? '',
    };
}

@Controller()
export class ScheduleGrpcController {
    constructor(private readonly scheduleService: WScheduleService) {}

    @GrpcMethod('ScheduleService', 'CreateSchedule')
    async createSchedule(data: CreateScheduleRequest) {
        try {
            const schedule = await this.scheduleService.create({
                date: data.date,
                startTime: data.startTime,
                endTime: data.endTime,
                repeatRule: data.repeatRule || undefined,
            });
            return { schedule: scheduleToRecord(schedule) };
        } catch (e) {
            throw new RpcException({ code: status.INTERNAL, message: e instanceof Error ? e.message : 'Internal error' });
        }
    }

    @GrpcMethod('ScheduleService', 'FindAllSchedules')
    async findAllSchedules() {
        try {
            const schedules = await this.scheduleService.findAll();
            return { data: schedules.map(scheduleToRecord) };
        } catch (e) {
            throw new RpcException({ code: status.INTERNAL, message: e instanceof Error ? e.message : 'Internal error' });
        }
    }

    @GrpcMethod('ScheduleService', 'FindScheduleById')
    async findScheduleById(data: ScheduleFindByIdRequest) {
        try {
            const schedule = await this.scheduleService.findOne(data.id);
            if (!schedule) throw new RpcException({ code: status.NOT_FOUND, message: 'Schedule not found' });
            return { schedule: scheduleToRecord(schedule) };
        } catch (e) {
            if (e instanceof RpcException) throw e;
            throw new RpcException({ code: status.INTERNAL, message: e instanceof Error ? e.message : 'Internal error' });
        }
    }

    @GrpcMethod('ScheduleService', 'DeleteSchedule')
    async deleteSchedule(data: ScheduleDeleteRequest) {
        try {
            await this.scheduleService.delete(data.id);
            return {};
        } catch (e) {
            throw new RpcException({ code: status.INTERNAL, message: e instanceof Error ? e.message : 'Internal error' });
        }
    }

    @GrpcMethod('ScheduleService', 'GetOccurrences')
    async getOccurrences(data: ScheduleOccurrencesRequest) {
        try {
            const dates = await this.scheduleService.getNextOccurrences(data.id, data.count || 5);
            return { dates: dates.map((d) => d.toISOString()) };
        } catch (e) {
            throw new RpcException({ code: status.INTERNAL, message: e instanceof Error ? e.message : 'Internal error' });
        }
    }
}
