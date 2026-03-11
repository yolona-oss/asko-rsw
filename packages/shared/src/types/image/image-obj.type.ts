import { ICloudinaryImage } from "./cloudinary-image.type";

export class IImageObj {
  original: ICloudinaryImage;
  thumbnail?: ICloudinaryImage;
  medium?: ICloudinaryImage;
  large?: ICloudinaryImage;
}
