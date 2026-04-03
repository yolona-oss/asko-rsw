import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { AppConfig } from '../app.config';
import { Image } from 'entities/image.entity';
import { ImageResizeProcessor } from 'services/image-resize.processor';
import { ImageResizeService } from 'services/image-resize.service';
import { STORAGE_PROVIDER } from 'storage/storage-provider.interface';
import { CloudinaryService } from 'services/cloudinary.service';
import { LocalStorageService } from 'services/local-storage.service';

export const IMAGE_RESIZE_QUEUE = 'image-resize';

@Module({
    imports: [
        BullModule.forRootAsync({
            inject: [AppConfig],
            useFactory: (config: AppConfig) => ({
                connection: { url: config.redisUrl },
            }),
        }),
        BullModule.registerQueue({ name: IMAGE_RESIZE_QUEUE }),
        MikroOrmModule.forFeature([Image]),
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
        ImageResizeService,
        ImageResizeProcessor,
    ],
    exports: [BullModule],
})
export class ImageResizeQueueModule {}
