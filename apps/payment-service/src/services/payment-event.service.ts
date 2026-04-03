import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { EntityManager } from '@mikro-orm/postgresql';
import { lastValueFrom } from 'rxjs';
import { FailedEventEntity } from 'entities/failed-event.entity';

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
    private readonly logger = new Logger(PaymentEventService.name);

    constructor(
        private readonly em: EntityManager,
        @Inject('EVENTS_SERVICE') private readonly notificationClient: ClientProxy,
        @Inject('REPAIR_EVENTS_SERVICE') private readonly repairClient: ClientProxy,
    ) {}

    async onModuleInit() {
        try {
            await this.notificationClient.connect();
        } catch (e) {
            this.logger.error('Failed to connect to notification RabbitMQ, will retry on first emit', e);
        }
        try {
            await this.repairClient.connect();
        } catch (e) {
            this.logger.error('Failed to connect to repair RabbitMQ, will retry on first emit', e);
        }
    }

    async emit(event: PaymentEvent): Promise<void> {
        this.logger.log(`Emitting ${event.type} for payment ${event.paymentId}`);

        const emitToClient = async (client: ClientProxy, name: string) => {
            try {
                await lastValueFrom(client.emit(event.type, event));
            } catch (e) {
                this.logger.error(`Failed to emit ${event.type} to ${name}: ${e}`);
                try {
                    const failedEvent = this.em.create(FailedEventEntity, {
                        eventType: event.type,
                        payload: event as unknown as Record<string, any>,
                        targetQueue: name,
                        nextRetryAt: new Date(Date.now() + 2 * 60 * 1000),
                        lastError: String(e),
                    });
                    await this.em.persistAndFlush(failedEvent);
                } catch (dbErr) {
                    this.logger.error(`Failed to persist failed event: ${dbErr}`);
                }
            }
        };

        await Promise.allSettled([
            emitToClient(this.notificationClient, 'notification'),
            emitToClient(this.repairClient, 'repair'),
        ]);
    }
}
