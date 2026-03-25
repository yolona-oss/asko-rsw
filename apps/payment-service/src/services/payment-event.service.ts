import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

export enum PaymentEventType {
    PAYMENT_CREATED = 'payment.created',
    PAYMENT_PAID = 'payment.paid',
    PAYMENT_FAILED = 'payment.failed',
    PAYMENT_REFUNDED = 'payment.refunded',
    WITHDRAW_CREATED = 'withdraw.created',
    WITHDRAW_PAID = 'withdraw.paid',
}

export interface PaymentEvent {
    type: PaymentEventType;
    paymentId: string;
    userId?: string;
    targetType?: string;
    targetId?: string;
    amount: number;
    currency: string;
    provider?: string;
    timestamp: Date;
}

@Injectable()
export class PaymentEventService implements OnModuleInit {
    constructor(
        @Inject('EVENTS_SERVICE') private readonly notificationClient: ClientProxy,
        @Inject('REPAIR_EVENTS_SERVICE') private readonly repairClient: ClientProxy,
    ) {}

    async onModuleInit() {
        try {
            await this.notificationClient.connect();
        } catch (e) {
            console.error('[PaymentEventService] Failed to connect to notification RabbitMQ, will retry on first emit:', e);
        }
        try {
            await this.repairClient.connect();
        } catch (e) {
            console.error('[PaymentEventService] Failed to connect to repair RabbitMQ, will retry on first emit:', e);
        }
    }

    async emit(event: PaymentEvent): Promise<void> {
        console.log(`[PaymentEvent] ${event.type}`, JSON.stringify(event));
        this.notificationClient.emit(event.type, event);
        this.repairClient.emit(event.type, event);
    }
}
