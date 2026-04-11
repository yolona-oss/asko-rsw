import { IsString, IsInt, IsNumber, IsOptional } from 'class-validator';

export class CreateAddressDto {
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
    country?: string;

    @IsOptional()
    @IsString()
    city?: string;

    @IsOptional()
    @IsString()
    street?: string;

    @IsOptional()
    @IsInt()
    house?: number;

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

    @IsOptional()
    @IsNumber()
    latitude?: number;

    @IsOptional()
    @IsNumber()
    longitude?: number;
}
