import { IImageObj } from "./image-obj.type";
import { ImageTypeEnum } from "./enum/image-type.enum";

export interface IImage {
    id: string;

    images: IImageObj;
    order: number;
    alt?: string;

    ownerType?: ImageTypeEnum;
    ownerId?: string;
}

export interface IImageAttachment {
    id: string;
    image: IImageObj;
    order: number;
    alt?: string;
}
