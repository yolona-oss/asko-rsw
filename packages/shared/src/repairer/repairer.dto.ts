import { IsArray, IsOptional, IsString, IsBoolean, IsNumber } from 'class-validator';

export class CreateRepairerDto {
    @IsString()
    userId!: string;

    @IsString()
    city!: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    specializations?: string[];
}

export class UpdateRepairerDto {
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    specializations?: string[];

    @IsOptional()
    @IsString()
    city?: string;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}

export class UpdateLocationDto {
    @IsNumber()
    latitude!: number;

    @IsNumber()
    longitude!: number;
}
