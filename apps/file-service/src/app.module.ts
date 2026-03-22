import { Logger, Module, OnApplicationBootstrap } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { AppConfig, AppConfigModule } from './app.config';
import { DatabaseModule } from 'modules/database.module';
import { Image } from 'entities/image.entity';
import { ImageService } from 'services/image.service';
import { ImageProcessingService } from 'services/image-processing.service';
import { CloudinaryService } from 'services/cloudinary.service';
import { LocalStorageService } from 'services/local-storage.service';
import { STORAGE_PROVIDER } from 'storage/storage-provider.interface';
import { FileGrpcController } from 'controllers/file.grpc.controller';
import { ImageTypeEnum } from '@asko/shared';
import { loadFileFromPath } from 'utils/fs';
import path from 'path';

@Module({
    imports: [
        AppConfigModule,
        DatabaseModule,
        MikroOrmModule.forFeature([Image]),
    ],
    controllers: [FileGrpcController],
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
        ImageService,
    ],
})
export class AppModule implements OnApplicationBootstrap {
    private readonly logger = new Logger(AppModule.name);

    constructor(
        private imagesService: ImageService,
        private config: AppConfig,
    ) {}

    async onApplicationBootstrap() {
        const seeds: [string, ImageTypeEnum][] = [
            [path.join(process.cwd(), this.config.blankImages.product), ImageTypeEnum.Product],
            [path.join(process.cwd(), this.config.blankImages.user), ImageTypeEnum.User],
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
