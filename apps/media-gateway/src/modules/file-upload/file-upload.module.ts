import { Module } from "@nestjs/common";
import { ImageUploadController } from "./controllers/image-upload.controller";
import { VideoUploadController } from "./controllers/video-upload.controller";
import { DocumentUploadController } from "./controllers/document-upload.controller";
import { FileClientModule } from "modules/file-client/file-client.module";

@Module({
    imports: [FileClientModule],
    controllers: [ImageUploadController, VideoUploadController, DocumentUploadController],
})
export class FileUploadModule {}
