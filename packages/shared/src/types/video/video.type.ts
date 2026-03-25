import { IVideoMetadata } from "./video-metadata.type";
import { VideoTypeEnum } from "./enum/video-type.enum";

export interface IVideo {
    id: string;
    videoJson: IVideoMetadata;
    order: number;
    ownerType?: VideoTypeEnum;
    ownerId?: string;
}
