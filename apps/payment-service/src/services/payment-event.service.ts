import { Injectable } from '@nestjs/common';

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
export class PaymentEventService {
    async emit(event: PaymentEvent): Promise<void> {
        // Phase 1: console.log
        // Phase 2: Publish to RabbitMQ exchange
        console.log(`[PaymentEvent] ${event.type}`, JSON.stringify(event));
    }
}
