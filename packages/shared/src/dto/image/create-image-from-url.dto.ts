import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ImageTypeEnum } from '../../types/image/enum/image-type.enum';

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
