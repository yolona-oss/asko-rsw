import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Image } from './image.entity';
import { ImageService } from './image.service';
import { ImageCleanupService } from './image-cleanup.service';
import { ImageResizeProcessor } from './image-resize.processor';
import { ImageResizeService } from './image-resize.service';

export const IMAGE_RESIZE_QUEUE = 'image-resize';

@Module({
    imports: [
        BullModule.registerQueue({ name: IMAGE_RESIZE_QUEUE }),
        MikroOrmModule.forFeature([Image]),
    ],
    providers: [
        ImageService,
        ImageCleanupService,
        ImageResizeService,
        ImageResizeProcessor,
    ],
    exports: [ImageService, ImageCleanupService],
})
export class ImageModule {}
