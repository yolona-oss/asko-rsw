import { ApiProperty } from '@nestjs/swagger';
import { AuthUserDto } from '@asko/gateway-common';
import { CertificateStatus } from '@asko/shared';
import { UserDeviceRecordDto } from './device.response.dto';
import { DealerProfileRecordDto } from './dealer.response.dto';

export class CertificateRecordDto {
    id: string;
    userId: string;
    userDeviceId: string;
    dealerId?: string;
    certificateNumber: string;
    @ApiProperty({ enum: CertificateStatus, enumName: 'CertificateStatus' })
    status: CertificateStatus;
    issuedAt: string;
    expiresAt: string;
    purchaseReceiptUrl?: string;
    description?: string;
    price?: number;
    paid: boolean;
    signature?: string;
    signedPayload?: string;
    user?: AuthUserDto;
    userDevice?: UserDeviceRecordDto;
    dealer?: DealerProfileRecordDto;
    createdAt: string;
}

export class CertificateResponseDto {
    certificate: CertificateRecordDto;
}

export class CertificateListResponseDto {
    @ApiProperty({ type: [CertificateRecordDto] })
    certificates: CertificateRecordDto[];
}

export class PaginatedCertificatesResponseDto {
    @ApiProperty({ type: [CertificateRecordDto] })
    data: CertificateRecordDto[];
    overallCount: number;
    page: number;
    limit: number;
}

export class CertPriceResponseDto {
    price: number;
}

export class CertValidateResponseDto {
    valid: boolean;
    certificate: CertificateRecordDto;
}

export class VerifySignatureResponseDto {
    valid: boolean;
    reason?: string;
    signedPayload?: string;
}

export class PublicKeyResponseDto {
    publicKeyPem: string;
    algorithm: string;
}
