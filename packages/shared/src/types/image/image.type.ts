import { IImageObj } from "./image-obj.type";
import { ImageTypeEnum } from "./enum/image-type.enum";

export interface IImage {
    id: string;

    imageJson: IImageObj;
    order: number;
    alt?: string;

    ownerType?: ImageTypeEnum;
    ownerId?: string;
}

export interface IImageAttachment {
    id: string;
    imageJson: IImageObj;
    order: number;
    alt?: string;
}
