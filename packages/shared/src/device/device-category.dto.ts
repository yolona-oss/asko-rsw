import { IsString, IsOptional, IsNumber } from 'class-validator';

export class CreateDeviceCategoryDto {
    @IsString()
    name!: string;

    @IsString()
    label!: string;

    @IsString()
    labelPlural!: string;

    @IsOptional()
    @IsNumber()
    order?: number;
}

export class UpdateDeviceCategoryDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    label?: string;

    @IsOptional()
    @IsString()
    labelPlural?: string;

    @IsOptional()
    @IsNumber()
    order?: number;
}
