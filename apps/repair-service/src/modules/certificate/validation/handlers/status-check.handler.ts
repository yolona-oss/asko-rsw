import { CertificateStatus } from '@asko/shared';
import { ValidationHandler } from 'common/validation';
import type { CertIntegrityContext } from '../cert-integrity-context';

export class StatusCheckHandler extends ValidationHandler<CertIntegrityContext> {
    protected async process(ctx: CertIntegrityContext): Promise<void> {
        if (ctx.status === CertificateStatus.REVOKED) {
            ctx.invalid = true;
            ctx.failReason = 'revoked';
            ctx.errorMessage = 'Certificate is revoked';
            return;
        }
        if (ctx.status === CertificateStatus.EXPIRED || new Date() > ctx.expiresAt) {
            ctx.invalid = true;
            ctx.failReason = 'expired';
            ctx.errorMessage = 'Certificate has expired';
        }
    }
}
