import { IImageEntry } from "./image-entry.type.js";

export class IImageObj {
  original: IImageEntry;
  thumbnail?: IImageEntry;
  medium?: IImageEntry;
  large?: IImageEntry;
}
