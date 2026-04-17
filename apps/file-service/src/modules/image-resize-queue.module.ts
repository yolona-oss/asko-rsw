import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Image } from 'entities/image.entity';
import { ImageResizeProcessor } from 'services/image-resize.processor';
import { ImageResizeService } from 'services/image-resize.service';

export const IMAGE_RESIZE_QUEUE = 'image-resize';

@Module({
    imports: [
        BullModule.registerQueue({ name: IMAGE_RESIZE_QUEUE }),
        MikroOrmModule.forFeature([Image]),
    ],
    providers: [
        ImageResizeService,
        ImageResizeProcessor,
    ],
    exports: [BullModule],
})
export class ImageResizeQueueModule {}
