import { Logger, Module, OnApplicationBootstrap } from "@nestjs/common";
import { ImageProcessingService } from "./services/image-processing.service";
import { CloudinaryService } from "./services/cloudinary.service";
import { LocalStorageService } from "./services/local-storage.service";
import { STORAGE_PROVIDER } from "./storage/storage-provider.interface";
import { MikroOrmModule } from "@mikro-orm/nestjs";
import { ImageUploadController } from "./controllers/image-upload.controller";
import { ImageService } from "./services/image.service";
import { AppConfig } from "app.config";
import { ImageTypeEnum } from "@asko/shared";

import path from "path";
import { loadFileFromPath } from "utils";
import { Image } from "@entities/image.entity";

@Module({
    imports: [
        MikroOrmModule.forFeature([
            Image
        ])
    ],
    controllers: [
        ImageUploadController
    ],
    providers: [
        {
            provide: STORAGE_PROVIDER,
            useFactory: (config: AppConfig) => {
                if (config.fileStorageMode === 'local') {
                    return new LocalStorageService(config);
                }
                return new CloudinaryService();
            },
            inject: [AppConfig],
        },
        ImageProcessingService,
        ImageService
    ],
    exports: [
        STORAGE_PROVIDER,
        ImageService
    ]
})
export class FileUploadModule implements OnApplicationBootstrap {
    private readonly logger = new Logger(FileUploadModule.name);

    constructor(
        private imagesService: ImageService,
        private config: AppConfig
    ) { }

    async onApplicationBootstrap() {
        const seeds: [string, ImageTypeEnum][] = [
            [path.join(process.cwd(), this.config.blankImages.product), ImageTypeEnum.Product],
            [path.join(process.cwd(), this.config.blankImages.user),    ImageTypeEnum.User],
            [path.join(process.cwd(), this.config.blankImages.category), ImageTypeEnum.Category],
        ];

        for (const [filePath, blankType] of seeds) {
            try {
                await this.imagesService.createBlank(await loadFileFromPath(filePath), blankType);
                this.logger.log(`Blank image seeded: ${blankType}`);
            } catch (e: any) {
                if (e?.status === 409 || e?.message?.includes('already exists')) {
                    this.logger.debug(`Blank image already exists: ${blankType}`);
                } else {
                    this.logger.error(`Failed to seed blank image [${blankType}] from ${filePath}: ${e?.message}`, e?.stack);
                }
            }
        }
    }
}
