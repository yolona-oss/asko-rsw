import { Module } from "@nestjs/common";
import { ImageUploadController } from "./controllers/image-upload.controller";
import { VideoUploadController } from "./controllers/video-upload.controller";
import { DocumentUploadController } from "./controllers/document-upload.controller";

@Module({
    controllers: [ImageUploadController, VideoUploadController, DocumentUploadController],
})
export class FileUploadModule {}
