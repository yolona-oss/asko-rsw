import { Injectable } from '@nestjs/common';
import { PaymentStatus } from '@asko/shared';
import { AppErrors } from 'common/error';

@Injectable()
export class PaymentDomainService {
    private static readonly VALID_TRANSITIONS: Record<PaymentStatus, PaymentStatus[]> = {
        [PaymentStatus.PENDING]: [PaymentStatus.PAID, PaymentStatus.FAILED],
        [PaymentStatus.PAID]: [PaymentStatus.REFUNDED],
        [PaymentStatus.REFUNDED]: [],
        [PaymentStatus.FAILED]: [],
    };

    canTransition(from: PaymentStatus, to: PaymentStatus): boolean {
        return PaymentDomainService.VALID_TRANSITIONS[from]?.includes(to) ?? false;
    }

    assertTransition(from: PaymentStatus, to: PaymentStatus): void {
        if (!this.canTransition(from, to)) {
            throw AppErrors.badRequest(`Invalid payment status transition: ${from} -> ${to}`);
        }
    }
}
