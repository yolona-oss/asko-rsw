export enum CertificateStatus {
    PENDING_APPROVAL = 'pending_approval',
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
    createdAt: Date;
}

/**
 * Generate certificate number in format ASKO-NNNN-NNNN
 */
export function generateCertificateNumber(): string {
    const part1 = Math.floor(1000 + Math.random() * 9000);
    const part2 = Math.floor(1000 + Math.random() * 9000);
    return `ASKO-${part1}-${part2}`;
}
