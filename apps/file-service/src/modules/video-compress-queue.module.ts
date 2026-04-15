import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { AppConfig } from '../app.config';
import { Video } from 'entities/video.entity';
import { VideoCompressProcessor } from 'services/video-compress.processor';
import { VideoCompressService } from 'services/video-compress.service';

export const VIDEO_COMPRESS_QUEUE = 'video-compress';

@Module({
    imports: [
        BullModule.forRootAsync({
            inject: [AppConfig],
            useFactory: (config: AppConfig) => ({
                connection: { url: config.redisUrl },
            }),
        }),
        BullModule.registerQueue({ name: VIDEO_COMPRESS_QUEUE }),
        MikroOrmModule.forFeature([Video]),
    ],
    providers: [
        VideoCompressService,
        VideoCompressProcessor,
    ],
    exports: [BullModule],
})
export class VideoCompressQueueModule {}
