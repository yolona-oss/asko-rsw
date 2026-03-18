import { IsString, IsOptional, IsDateString, IsInt } from 'class-validator';

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
    country!: string;

    @IsString()
    city!: string;

    @IsString()
    street!: string;

    @IsInt()
    house!: number;

    @IsOptional()
    @IsInt()
    building?: number;

    @IsOptional()
    @IsInt()
    floor?: number;

    @IsOptional()
    @IsInt()
    room?: number;

    @IsOptional()
    @IsString()
    postalCode?: string;

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
