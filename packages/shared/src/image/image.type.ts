import { IImageObj } from "./image-obj.type.js";
import { ImageTypeEnum } from "./image-type.enum.js";

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
