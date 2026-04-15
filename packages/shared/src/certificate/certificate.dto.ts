import { IsString, IsOptional, IsDateString, IsInt, IsIn } from 'class-validator';
import { CERTIFICATE_DURATION_OPTIONS } from './certificate.constants.js';

/** User adds an existing certificate */
export class AddCertificateDto {
    @IsString()
    userDeviceId!: string;

    @IsString()
    certificateNumber!: string;

    @IsDateString()
    expiresAt!: string;
}

/** Dealer creates a new certificate for a client's device */
export class CreateCertificateDto {
    @IsString()
    clientUserId!: string;

    @IsString()
    deviceId!: string;

    @IsString()
    serialNumber!: string;

    @IsString()
    city!: string;

    @IsString()
    street!: string;

    @IsString()
    house!: string;

    @IsOptional()
    @IsString()
    building?: string;

    @IsOptional()
    @IsString()
    apartment?: string;

    @IsOptional()
    @IsString()
    entrance?: string;

    @IsOptional()
    @IsString()
    floor?: string;

    @IsOptional()
    @IsString()
    intercom?: string;

    @IsInt()
    @IsIn(CERTIFICATE_DURATION_OPTIONS as unknown as number[])
    durationMonths!: number;

    @IsOptional()
    @IsString()
    purchaseReceiptUrl?: string;

    @IsOptional()
    @IsString()
    description?: string;
}

/** User self-creates a certificate for their own device (backend generates cert number; PENDING_PAYMENT + invoice) */
export class SelfCreateCertificateDto {
    @IsString()
    userDeviceId!: string;

    @IsInt()
    @IsIn(CERTIFICATE_DURATION_OPTIONS as unknown as number[])
    durationMonths!: number;

    @IsOptional()
    @IsString()
    description?: string;
}

export class AssignCertificateDto {
    @IsString()
    userDeviceId!: string;
}

/** User reapplies a certificate (renew/extend). Creates a new PENDING_PAYMENT cert
 *  pointing at the source cert via replacedCertificateId. Same device, new duration. */
export class ReapplyCertificateDto {
    @IsInt()
    @IsIn(CERTIFICATE_DURATION_OPTIONS as unknown as number[])
    durationMonths!: number;

    @IsOptional()
    @IsString()
    description?: string;
}
