import { IsString, IsOptional, IsDateString } from 'class-validator';

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
    userDeviceId!: string;

    @IsDateString()
    expiresAt!: string;

    @IsOptional()
    @IsString()
    purchaseReceiptUrl?: string;

    @IsOptional()
    @IsString()
    description?: string;
}

export class AssignCertificateDto {
    @IsString()
    userDeviceId!: string;
}
