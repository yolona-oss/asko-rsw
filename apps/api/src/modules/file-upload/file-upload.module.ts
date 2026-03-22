import { Module } from "@nestjs/common";
import { ImageUploadController } from "./controllers/image-upload.controller";
import { FileClientModule } from "modules/file-client/file-client.module";

@Module({
    imports: [FileClientModule],
    controllers: [ImageUploadController],
})
export class FileUploadModule {}
