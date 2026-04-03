import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { EntityManager, CreateRequestContext } from '@mikro-orm/postgresql';
import { PaymentEntity } from 'entities/payment.entity';
import { PaymentStatus } from '@asko/shared';
import { PaymentDomainService } from './payment-domain.service';
import { PaymentEventService, PaymentEventType } from './payment-event.service';

@Injectable()
export class PaymentExpirationService {
    private readonly logger = new Logger(PaymentExpirationService.name);

    constructor(
        private readonly em: EntityManager,
        private readonly domainService: PaymentDomainService,
        private readonly eventService: PaymentEventService,
    ) {}

    @Cron('*/5 * * * *')
    @CreateRequestContext()
    async expireStalePayments(): Promise<void> {
        const now = new Date();
        const expired = await this.em.find(PaymentEntity, {
            status: PaymentStatus.PENDING,
            expiresAt: { $ne: null, $lt: now },
        });

        if (expired.length === 0) return;

        this.logger.log(`Expiring ${expired.length} stale PENDING payments`);

        for (const payment of expired) {
            try {
                this.domainService.assertTransition(payment.status, PaymentStatus.FAILED);
                await this.domainService.recordTransition(payment.id, PaymentStatus.PENDING, PaymentStatus.FAILED, 'cron:expiration', 'Payment expired');
                payment.status = PaymentStatus.FAILED;

                await this.eventService.emit({
                    type: PaymentEventType.PAYMENT_FAILED,
                    paymentId: payment.id,
                    userId: payment.userId,
                    targetType: payment.targetType,
                    targetId: payment.targetId,
                    amount: payment.amount,
                    currency: payment.currency,
                    provider: payment.provider,
                    timestamp: new Date(),
                });
            } catch (e) {
                this.logger.error(`Failed to expire payment ${payment.id}: ${e}`);
            }
        }

        await this.em.flush();
    }
}
