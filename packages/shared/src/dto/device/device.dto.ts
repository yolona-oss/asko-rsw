import { IsString, IsOptional, IsDateString, IsObject, IsNumber, IsBoolean } from 'class-validator';

export class CreateDeviceDto {
    @IsString()
    name!: string;

    @IsString()
    type!: string;

    @IsString()
    model!: string;

    @IsString()
    brand!: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsObject()
    specifications?: Record<string, any>;

    @IsOptional()
    @IsObject()
    features?: Record<string, any>;

    @IsOptional()
    @IsBoolean()
    isFeatured?: boolean;
}

export class UpdateDeviceDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    type?: string;

    @IsOptional()
    @IsString()
    model?: string;

    @IsOptional()
    @IsString()
    brand?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsObject()
    specifications?: Record<string, any>;

    @IsOptional()
    @IsObject()
    features?: Record<string, any>;

    @IsOptional()
    @IsString()
    slug?: string;

    @IsOptional()
    @IsBoolean()
    isFeatured?: boolean;
}

export class CreateDevicePartDto {
    @IsString()
    name!: string;

    @IsOptional()
    @IsString()
    partNumber?: string;

    @IsOptional()
    @IsNumber()
    price?: number;

    @IsOptional()
    @IsString()
    description?: string;
}

export class UpdateDevicePartDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    partNumber?: string;

    @IsOptional()
    @IsNumber()
    price?: number;

    @IsOptional()
    @IsString()
    description?: string;
}

export class RegisterUserDeviceDto {
    @IsString()
    deviceId!: string;

    @IsString()
    serialNumber!: string;

    @IsString()
    addressId!: string;

    @IsOptional()
    @IsDateString()
    purchaseDate?: string;

    @IsOptional()
    @IsDateString()
    warrantyUntil?: string;

    @IsOptional()
    @IsString()
    notes?: string;
}
