import { PaymentTargetType } from '@asko/shared';
import { ValidationHandler } from 'common/validation';
import type { PaidPaymentService } from 'modules/shared-services/services/paid-payment.service';
import type { CertIntegrityContext } from '../cert-integrity-context';

export class PaymentCrossCheckHandler extends ValidationHandler<CertIntegrityContext> {
    constructor(private readonly paidPayments: PaidPaymentService) {
        super();
    }

    protected async process(ctx: CertIntegrityContext): Promise<void> {
        // Only check invoiced certs. Bundled certs (price=null) have no Payment row by design.
        if (ctx.price == null) return;

        const hasPaid = await this.paidPayments.hasPaid(
            PaymentTargetType.CERTIFICATE,
            ctx.certId,
        );
        if (!hasPaid) {
            ctx.invalid = true;
            ctx.failReason = 'payment_not_found';
            ctx.errorMessage = 'Certificate payment not verified';
        }
    }
}
