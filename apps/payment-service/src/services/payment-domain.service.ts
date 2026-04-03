import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PaymentStatus } from '@asko/shared';
import { AppErrors } from 'common/error';
import { PaymentAuditEntity } from 'entities/payment-audit.entity';

@Injectable()
export class PaymentDomainService {
    private static readonly MAX_AMOUNT = 1_000_000;

    private static readonly VALID_TRANSITIONS: Record<PaymentStatus, PaymentStatus[]> = {
        [PaymentStatus.PENDING]: [PaymentStatus.PAID, PaymentStatus.FAILED],
        [PaymentStatus.PAID]: [PaymentStatus.PARTIALLY_REFUNDED, PaymentStatus.REFUNDED],
        [PaymentStatus.PARTIALLY_REFUNDED]: [PaymentStatus.PARTIALLY_REFUNDED, PaymentStatus.REFUNDED],
        [PaymentStatus.REFUNDED]: [],
        [PaymentStatus.FAILED]: [],
    };

    constructor(private readonly em: EntityManager) {}

    canTransition(from: PaymentStatus, to: PaymentStatus): boolean {
        return PaymentDomainService.VALID_TRANSITIONS[from]?.includes(to) ?? false;
    }

    assertTransition(from: PaymentStatus, to: PaymentStatus): void {
        if (!this.canTransition(from, to)) {
            throw AppErrors.badRequest(`Invalid payment status transition: ${from} -> ${to}`);
        }
    }

    async recordTransition(
        paymentId: string,
        fromStatus: string | null,
        toStatus: string,
        actor: string,
        reason?: string,
    ): Promise<void> {
        const audit = this.em.create(PaymentAuditEntity, {
            paymentId,
            fromStatus: fromStatus ?? undefined,
            toStatus,
            actor,
            reason,
        });
        this.em.persist(audit);
    }

    validateAmount(amount: number): void {
        if (typeof amount !== 'number' || !Number.isFinite(amount)) {
            throw AppErrors.invalidData('Amount must be a valid number');
        }
        if (amount <= 0) {
            throw AppErrors.invalidData('Amount must be greater than 0');
        }
        if (amount > PaymentDomainService.MAX_AMOUNT) {
            throw AppErrors.invalidData(`Amount must not exceed ${PaymentDomainService.MAX_AMOUNT}`);
        }
        const decimals = amount.toString().split('.')[1];
        if (decimals && decimals.length > 2) {
            throw AppErrors.invalidData('Amount must have at most 2 decimal places');
        }
    }
}
