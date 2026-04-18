import { ValidationHandler } from 'common/validation';
import type { CertIntegrityContext } from '../cert-integrity-context';

export class PaymentFlagHandler extends ValidationHandler<CertIntegrityContext> {
    protected async process(ctx: CertIntegrityContext): Promise<void> {
        if (!ctx.paid) {
            ctx.invalid = true;
            ctx.failReason = 'not_paid';
            ctx.errorMessage = 'Certificate is not paid';
        }
    }
}
