import { IsString, IsOptional, IsEnum, IsDateString, IsObject } from 'class-validator';
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
    @IsString()
    link?: string;
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
    @IsString()
    link?: string;
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
