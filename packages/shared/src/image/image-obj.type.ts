import { ICloudinaryImage } from "./cloudinary-image.type.js";

export class IImageObj {
  original: ICloudinaryImage;
  thumbnail?: ICloudinaryImage;
  medium?: ICloudinaryImage;
  large?: ICloudinaryImage;
}
