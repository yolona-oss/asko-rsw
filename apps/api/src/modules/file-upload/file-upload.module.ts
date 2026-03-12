import { Module, OnApplicationBootstrap } from "@nestjs/common";
import { ImageProcessingService } from "./services/image-processing.service";
import { CloudinaryService } from "./services/cloudinary.service";
import { MikroOrmModule } from "@mikro-orm/nestjs";
import { ImageUploadController } from "./controllers/image-upload.controller";
import { ImageService } from "./services/image.service";
import { AppConfig } from "app.config";
import { DefaultImagesType, ImageTypeEnum } from "@asko/shared";

import path from "path";

import { Express } from "express";
import { loadFileFromPath } from "utils";

@Module({
    imports: [
        MikroOrmModule.forFeature([

        ])
    ],
    controllers: [
        ImageUploadController
    ],
    providers: [
        CloudinaryService,
        ImageProcessingService,
        ImageService
    ],
    exports: [
        CloudinaryService,
        ImageService
    ]
})
export class FileUploadModule implements OnApplicationBootstrap {
    constructor(
        private imagesService: ImageService,
        private config: AppConfig
    ) {}

    async onApplicationBootstrap() {
        const productImagePath = path.join(process.cwd(), this.config.blankImages.product)
        const userImagePath = path.join(process.cwd(), this.config.blankImages.user)
        const categoryImagePath = path.join(process.cwd(), this.config.blankImages.category)

        try {
            await this.imagesService.createBlank(await loadFileFromPath(productImagePath), ImageTypeEnum.Product)
        } catch(e) {
            console.log(e)
        }
        try {
            await this.imagesService.createBlank(await loadFileFromPath(userImagePath), ImageTypeEnum.User)
        } catch(e) {
            console.log(e)
        }
        try {
            await this.imagesService.createBlank(await loadFileFromPath(categoryImagePath), ImageTypeEnum.Category)
        } catch(e) {
            console.log(e)
        }
    }
}
