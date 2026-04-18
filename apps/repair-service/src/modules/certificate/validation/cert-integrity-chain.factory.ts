import type { ValidationHandler } from 'common/validation';
import type { SignatureService } from 'modules/shared-services/services/signature.service';
import type { PaidPaymentService } from 'modules/shared-services/services/paid-payment.service';
import { StatusCheckHandler } from './handlers/status-check.handler';
import { PaymentFlagHandler } from './handlers/payment-flag.handler';
import { SignatureHandler } from './handlers/signature.handler';
import { PaymentCrossCheckHandler } from './handlers/payment-cross-check.handler';
import type { CertIntegrityContext } from './cert-integrity-context';

/**
 * Build the certificate integrity validation chain.
 * Ordered cheap → expensive: status → paid flag → signature → payment cross-check.
 *
 * To add a new integrity check, instantiate the handler and link it in order.
 */
export function buildCertIntegrityChain(
    signatureService: SignatureService,
    paidPayments: PaidPaymentService,
): ValidationHandler<CertIntegrityContext> {
    const statusCheck = new StatusCheckHandler();
    const paymentFlag = new PaymentFlagHandler();
    const signature = new SignatureHandler(signatureService);
    const paymentCrossCheck = new PaymentCrossCheckHandler(paidPayments);

    statusCheck
        .setNext(paymentFlag)
        .setNext(signature)
        .setNext(paymentCrossCheck);

    return statusCheck;
}
