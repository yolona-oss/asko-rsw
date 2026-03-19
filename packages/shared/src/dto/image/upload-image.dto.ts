import { IsOptional, IsString, IsNumber } from 'class-validator';

export class UploadImageDto {
    @IsOptional()
    @IsString()
    alt?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsNumber()
    order?: number;
}

export class UploadBlackImageDto extends UploadImageDto {
    @IsOptional()
    @IsString()
    blankType?: string;
}
