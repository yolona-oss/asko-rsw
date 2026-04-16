import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

export enum RepairEventType {
    STATUS_CHANGED = 'repair.status_changed',
    ASSIGNED = 'repair.assigned',
    TRANSFERRED = 'repair.transferred',
    DIAGNOSTICS_APPROVED = 'repair.diagnostics_approved',
    DIAGNOSTICS_DECLINED = 'repair.diagnostics_declined',
    COMPLETED = 'repair.completed',
    AVR_GENERATED = 'repair.avr_generated',
    AVR_SIGNING_REQUESTED = 'repair.avr_signing_requested',
    AVR_SIGNED = 'repair.avr_signed',
    SCHEDULE_ENDING = 'repair.schedule_ending',
    SCHEDULE_AUTO_PAUSED = 'repair.schedule_auto_paused',
    CERTIFICATE_EXPIRING_SOON = 'certificate.expiring_soon',
    CERTIFICATE_EXPIRED = 'certificate.expired',
    ADDRESS_VALIDATED = 'address.validated',
    ADDRESS_VALIDATION_FAILED = 'address.validation_failed',
    USER_DEVICE_VALIDATED = 'user_device.validated',
    USER_DEVICE_VALIDATION_FAILED = 'user_device.validation_failed',
}

export interface AddressEvent {
    type: RepairEventType.ADDRESS_VALIDATED | RepairEventType.ADDRESS_VALIDATION_FAILED;
    addressId: string;
    userId: string;
    city: string;
    street: string;
    house: string;
    validationError?: string;
    timestamp: Date;
}

export interface UserDeviceEvent {
    type: RepairEventType.USER_DEVICE_VALIDATED | RepairEventType.USER_DEVICE_VALIDATION_FAILED;
    userDeviceId: string;
    userId: string;
    serialNumber: string;
    deviceName: string;
    validationError?: string;
    timestamp: Date;
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
    repairerUserId?: string;
    managerId?: string;
    oldRepairerId?: string;
    newRepairerId?: string;
    oldRepairerUserId?: string;
    newRepairerUserId?: string;
    reason?: string;
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

    async emitCertificateEvent(event: CertificateEvent): Promise<void> {
        console.log(`[CertificateEvent] ${event.type}`, JSON.stringify(event));
        this.rmqClient.emit(event.type, event);
    }

    async emitAddressEvent(event: AddressEvent): Promise<void> {
        console.log(`[AddressEvent] ${event.type}`, JSON.stringify(event));
        this.rmqClient.emit(event.type, event);
    }

    async emitUserDeviceEvent(event: UserDeviceEvent): Promise<void> {
        console.log(`[UserDeviceEvent] ${event.type}`, JSON.stringify(event));
        this.rmqClient.emit(event.type, event);
    }
}
