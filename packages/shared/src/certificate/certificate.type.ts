export enum CertificateStatus {
    PENDING_PAYMENT = 'pending_payment',
    VALIDATION_ERROR = 'validation_error',
    ACTIVE = 'active',
    EXPIRED = 'expired',
    REVOKED = 'revoked',
}

export interface ICertificate {
    id: string;
    userId: string;
    userDeviceId: string;
    dealerId?: string;
    certificateNumber: string;
    status: CertificateStatus;
    issuedAt: Date;
    expiresAt: Date;
    purchaseReceiptUrl?: string;
    description?: string;
    price?: number;
    paid: boolean;
    user?: import('../user/user.type.js').IUser;
    userDevice?: import('../device/device.type.js').IUserDevice;
    dealer?: import('../dealer/dealer.type.js').IDealerProfile;
    signature?: string;
    signedPayload?: string;
    createdAt: Date;
}

/** Frozen copy of a certificate's state captured when a repair request is
 *  completed. Never rewritten afterwards, so later revocation/expiry of the
 *  cert does not retroactively change the request's historical display. */
export interface ICertificateSnapshot {
    id: string;
    certificateNumber: string;
    status: CertificateStatus;
    issuedAt: string;
    expiresAt: string;
    frozenAt: string;
    signedPayload?: string;
    signature?: string;
}

/**
 * Generate certificate number in format ASKO-NNNN-NNNN
 */
export function generateCertificateNumber(): string {
    const part1 = Math.floor(1000 + Math.random() * 9000);
    const part2 = Math.floor(1000 + Math.random() * 9000);
    return `ASKO-${part1}-${part2}`;
}
