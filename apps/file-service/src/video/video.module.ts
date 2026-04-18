import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Video } from './video.entity';
import { VideoService } from './video.service';
import { VideoCompressService } from './video-compress.service';
import { VideoCompressProcessor } from './video-compress.processor';

export const VIDEO_COMPRESS_QUEUE = 'video-compress';

@Module({
    imports: [
        BullModule.registerQueue({ name: VIDEO_COMPRESS_QUEUE }),
        MikroOrmModule.forFeature([Video]),
    ],
    providers: [
        VideoService,
        VideoCompressService,
        VideoCompressProcessor,
    ],
    exports: [VideoService],
})
export class VideoModule {}
