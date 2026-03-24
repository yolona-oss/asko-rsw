import { IsString, IsOptional, IsEnum, IsDateString, IsObject, IsNumber } from 'class-validator';
import { DeviceType } from '../../types/device.type';

export class CreateDeviceDto {
    @IsString()
    name!: string;

    @IsEnum(DeviceType)
    type!: DeviceType;

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
}

export class UpdateDeviceDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsEnum(DeviceType)
    type?: DeviceType;

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
