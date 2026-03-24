import { ApiProperty } from '@nestjs/swagger';

export class CertificateRecordDto {
    id: string;
    userId: string;
    userDeviceId: string;
    dealerId: string;
    certificateNumber: string;
    status: string;
    issuedAt: string;
    expiresAt: string;
    price: number;
    paid: boolean;
    purchaseReceiptUrl: string;
    description: string;
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
    offset: number;
    limit: number;
}

export class CertPriceResponseDto {
    price: number;
}

export class CertValidateResponseDto {
    valid: boolean;
    certificate: CertificateRecordDto;
}
