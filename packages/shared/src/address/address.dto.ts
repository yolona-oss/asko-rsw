import { IsString, IsNumber, IsOptional } from 'class-validator';

export class CreateAddressDto {
    @IsString()
    city!: string;

    @IsOptional()
    @IsString()
    district?: string;

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

    @IsOptional()
    @IsString()
    comment?: string;

    @IsOptional()
    @IsNumber()
    latitude?: number;

    @IsOptional()
    @IsNumber()
    longitude?: number;
}

export class UpdateAddressDto {
    @IsOptional()
    @IsString()
    city?: string;

    @IsOptional()
    @IsString()
    district?: string;

    @IsOptional()
    @IsString()
    street?: string;

    @IsOptional()
    @IsString()
    house?: string;

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

    @IsOptional()
    @IsString()
    comment?: string;

    @IsOptional()
    @IsNumber()
    latitude?: number;

    @IsOptional()
    @IsNumber()
    longitude?: number;
}
