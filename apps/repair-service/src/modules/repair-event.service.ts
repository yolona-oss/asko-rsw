import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

export enum RepairEventType {
    STATUS_CHANGED = 'repair.status_changed',
    ASSIGNED = 'repair.assigned',
    COMPLETED = 'repair.completed',
}

export interface RepairEvent {
    type: RepairEventType;
    repairId: string;
    userId: string;
    oldStatus?: string;
    newStatus?: string;
    repairerId?: string;
    timestamp: Date;
}

@Injectable()
export class RepairEventService implements OnModuleInit {
    constructor(
        @Inject('REPAIR_EVENTS') private readonly rmqClient: ClientProxy,
    ) {}

    async onModuleInit() {
        try {
            await this.rmqClient.connect();
        } catch (e) {
            console.error('[RepairEventService] Failed to connect to RabbitMQ, will retry on first emit:', e);
        }
    }

    async emit(event: RepairEvent): Promise<void> {
        console.log(`[RepairEvent] ${event.type}`, JSON.stringify(event));
        this.rmqClient.emit(event.type, event);
    }
}
