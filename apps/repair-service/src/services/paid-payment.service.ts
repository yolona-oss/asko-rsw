import { Injectable } from '@nestjs/common';
import { CreateRequestContext, EntityManager } from '@mikro-orm/postgresql';
import { PaidPayment } from 'entities/paid-payment.entity';

/**
 * Local cache of paid payments, sourced from `payment.paid` RMQ events.
 *
 * Replaces the old synchronous gRPC call from repair-service →
 * payment-service for certificate-integrity checks. Fail mode stays the
 * same as before: if payment-service is down, new events aren't delivered
 * and the cache goes stale — downstream callers (e.g.
 * `CertificateService.verifyCertificateIntegrity`) treat a missing cache
 * entry as "payment not found" and fail closed.
 */
export interface UpsertPaidPaymentInput {
    paymentId: string;
    targetType: string;
    targetId: string;
    userId?: string;
    amount?: number;
    currency?: string;
    paidAt?: Date;
}

@Injectable()
export class PaidPaymentService {
    constructor(private readonly em: EntityManager) {}

    /**
     * Idempotent upsert — called from the `payment.paid` event handler.
     * Duplicate deliveries with the same `paymentId` are silently merged.
     */
    @CreateRequestContext()
    async upsert(input: UpsertPaidPaymentInput): Promise<void> {
        const existing = await this.em.findOne(PaidPayment, { paymentId: input.paymentId });
        if (existing) {
            existing.targetType = input.targetType;
            existing.targetId = input.targetId;
            existing.userId = input.userId;
            existing.amount = input.amount;
            existing.currency = input.currency;
            if (input.paidAt) existing.paidAt = input.paidAt;
            await this.em.flush();
            return;
        }

        const row = this.em.create(PaidPayment, {
            paymentId: input.paymentId,
            targetType: input.targetType,
            targetId: input.targetId,
            userId: input.userId,
            amount: input.amount,
            currency: input.currency,
            paidAt: input.paidAt ?? new Date(),
        });
        await this.em.persistAndFlush(row);
    }

    /**
     * True iff a paid payment exists in the cache for the given target.
     * Used by the certificate-integrity verifier.
     */
    @CreateRequestContext()
    async hasPaid(targetType: string, targetId: string): Promise<boolean> {
        const count = await this.em.count(PaidPayment, { targetType, targetId });
        return count > 0;
    }
}
