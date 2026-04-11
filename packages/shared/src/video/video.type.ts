import { IVideoMetadata } from "./video-metadata.type.js";
import { VideoTypeEnum } from "./video-type.enum.js";

export interface IVideo {
    id: string;
    videoJson: IVideoMetadata;
    order: number;
    ownerType?: VideoTypeEnum;
    ownerId?: string;
}
