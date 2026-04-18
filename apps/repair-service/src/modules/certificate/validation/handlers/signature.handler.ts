import { ValidationHandler } from 'common/validation';
import type { SignatureService } from 'modules/shared-services/services/signature.service';
import type { CertIntegrityContext } from '../cert-integrity-context';

export class SignatureHandler extends ValidationHandler<CertIntegrityContext> {
    constructor(private readonly signatureService: SignatureService) {
        super();
    }

    protected async process(ctx: CertIntegrityContext): Promise<void> {
        const result = this.signatureService.verifyStoredSignature(ctx.signedPayload, ctx.signature);
        if (!result.valid) {
            ctx.invalid = true;
            ctx.failReason = 'signature_invalid';
            ctx.errorMessage = 'Certificate signature is invalid';
        }
    }
}
