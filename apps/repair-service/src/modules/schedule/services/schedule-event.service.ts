import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

export enum ScheduleEventType {
    SCHEDULE_CREATED = 'schedule.created',
    SCHEDULE_UPDATED = 'schedule.updated',
    SCHEDULE_DELETED = 'schedule.deleted',
    SCHEDULE_APPROVED = 'schedule.approved',
    SCHEDULE_REJECTED = 'schedule.rejected',
    SCHEDULE_PATTERN_CREATED = 'schedule.pattern_created',
    SCHEDULE_PATTERN_UPDATED = 'schedule.pattern_updated',
    SCHEDULE_PATTERN_DELETED = 'schedule.pattern_deleted',
    SCHEDULE_PATTERN_APPROVED = 'schedule.pattern_approved',
    SCHEDULE_PATTERN_REJECTED = 'schedule.pattern_rejected',
}

export interface ScheduleEvent {
    type: string;
    scheduleId: string;
    userId: string;
    actorId?: string;
    scheduleType: string;
    timestamp: Date;
}

export interface SchedulePatternEvent {
    type: string;
    patternId: string;
    userId: string;
    actorId?: string | null;
    staged: boolean;
    firstSubmission: boolean;
    timestamp: Date;
}

@Injectable()
export class ScheduleEventService implements OnModuleInit {
    constructor(
        @Inject('REPAIR_EVENTS') private readonly rmqClient: ClientProxy,
    ) {}

    async onModuleInit() {
        try {
            await this.rmqClient.connect();
        } catch (e) {
            console.error('[ScheduleEventService] Failed to connect to RabbitMQ, will retry on first emit:', e);
        }
    }

    async emit(event: ScheduleEvent): Promise<void> {
        console.log(`[ScheduleEvent] ${event.type}`, JSON.stringify(event));
        this.rmqClient.emit(event.type, event);
    }

    async emitPattern(event: SchedulePatternEvent): Promise<void> {
        console.log(`[SchedulePatternEvent] ${event.type}`, JSON.stringify(event));
        this.rmqClient.emit(event.type, event);
    }
}
