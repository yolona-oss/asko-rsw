import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ImageTypeEnum } from './image-type.enum.js';

export class CreateImageFromUrlDto {
    @IsString()
    url!: string;

    @IsOptional()
    @IsEnum(ImageTypeEnum)
    ownerType?: ImageTypeEnum;

    @IsOptional()
    @IsString()
    ownerId?: string;
}
