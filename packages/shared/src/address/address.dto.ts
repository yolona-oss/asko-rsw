import { IsString, IsNumber, IsOptional, IsNotEmpty } from 'class-validator';

export class CreateAddressDto {
    @IsNotEmpty()
    @IsString()
    city!: string;

    @IsOptional()
    @IsString()
    district?: string;

    @IsNotEmpty()
    @IsString()
    street!: string;

    @IsNotEmpty()
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
    @IsNotEmpty()
    @IsString()
    city?: string;

    @IsOptional()
    @IsString()
    district?: string;

    @IsOptional()
    @IsNotEmpty()
    @IsString()
    street?: string;

    @IsOptional()
    @IsNotEmpty()
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
