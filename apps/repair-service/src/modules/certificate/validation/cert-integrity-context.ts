import type { ValidationContext } from 'common/validation';
import type { CertificateStatus } from '@asko/shared';

export type IntegrityFailReason =
    | 'revoked'
    | 'expired'
    | 'not_paid'
    | 'signature_invalid'
    | 'payment_not_found';

export interface CertIntegrityContext extends ValidationContext {
    certId: string;
    status: CertificateStatus;
    paid: boolean;
    expiresAt: Date;
    signedPayload?: string | null;
    signature?: string | null;
    /** null = bundled cert (no invoice), number = invoiced cert price */
    price: number | null;

    /** Specific failure reason set by handlers. */
    failReason?: IntegrityFailReason;
}
