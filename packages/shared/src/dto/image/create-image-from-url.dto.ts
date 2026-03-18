import { ImageTypeEnum } from '../../types/image/enum/image-type.enum';

export class CreateImageFromUrlDto {
    url!: string;
    ownerType?: ImageTypeEnum;
    ownerId?: string;
}
