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
        @Inject('EVENTS_SERVICE') private readonly rmqClient: ClientProxy,
    ) {}

    async onModuleInit() {
        try {
            await this.rmqClient.connect();
        } catch (e) {
            console.error('[PaymentEventService] Failed to connect to RabbitMQ, will retry on first emit:', e);
        }
    }

    async emit(event: PaymentEvent): Promise<void> {
        console.log(`[PaymentEvent] ${event.type}`, JSON.stringify(event));
        this.rmqClient.emit(event.type, event);
    }
}
