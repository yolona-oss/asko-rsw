import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

export enum RepairEventType {
    STATUS_CHANGED = 'repair.status_changed',
    ASSIGNED = 'repair.assigned',
    TRANSFERRED = 'repair.transferred',
    DIAGNOSTICS_APPROVED = 'repair.diagnostics_approved',
    DIAGNOSTICS_DECLINED = 'repair.diagnostics_declined',
    COMPLETED = 'repair.completed',
    SCHEDULE_CREATED = 'schedule.created',
    SCHEDULE_UPDATED = 'schedule.updated',
    SCHEDULE_APPROVED = 'schedule.approved',
    SCHEDULE_REJECTED = 'schedule.rejected',
    SCHEDULE_PATTERN_CREATED = 'schedule.pattern_created',
    SCHEDULE_PATTERN_UPDATED = 'schedule.pattern_updated',
    SCHEDULE_PATTERN_APPROVED = 'schedule.pattern_approved',
    SCHEDULE_PATTERN_REJECTED = 'schedule.pattern_rejected',
    CERTIFICATE_EXPIRING_SOON = 'certificate.expiring_soon',
    CERTIFICATE_EXPIRED = 'certificate.expired',
}

export interface CertificateEvent {
    type: RepairEventType.CERTIFICATE_EXPIRING_SOON | RepairEventType.CERTIFICATE_EXPIRED;
    certificateId: string;
    certificateNumber: string;
    userId: string;
    userDeviceId: string;
    expiresAt: string;
    daysUntilExpiry: number;
    timestamp: Date;
}

export interface RepairEvent {
    type: RepairEventType;
    repairId: string;
    userId: string;
    oldStatus?: string;
    newStatus?: string;
    repairerId?: string;
    oldRepairerId?: string;
    newRepairerId?: string;
    oldRepairerUserId?: string;
    newRepairerUserId?: string;
    reason?: string;
    timestamp: Date;
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

    async emitScheduleEvent(event: ScheduleEvent): Promise<void> {
        console.log(`[ScheduleEvent] ${event.type}`, JSON.stringify(event));
        this.rmqClient.emit(event.type, event);
    }

    async emitSchedulePatternEvent(event: SchedulePatternEvent): Promise<void> {
        console.log(`[SchedulePatternEvent] ${event.type}`, JSON.stringify(event));
        this.rmqClient.emit(event.type, event);
    }

    async emitCertificateEvent(event: CertificateEvent): Promise<void> {
        console.log(`[CertificateEvent] ${event.type}`, JSON.stringify(event));
        this.rmqClient.emit(event.type, event);
    }
}
