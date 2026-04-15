import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { EntityManager, CreateRequestContext } from '@mikro-orm/postgresql';
import { Video } from 'entities/video.entity';
import { VideoCompressService } from './video-compress.service';
import { AppConfig } from 'app.config';
import { VIDEO_COMPRESS_QUEUE } from 'modules/video-compress-queue.module';

export interface VideoCompressJobData {
    videoId: string;
}

@Processor(VIDEO_COMPRESS_QUEUE)
export class VideoCompressProcessor extends WorkerHost {
    private readonly logger = new Logger(VideoCompressProcessor.name);

    constructor(
        private readonly em: EntityManager,
        private readonly config: AppConfig,
        private readonly compressService: VideoCompressService,
    ) {
        super();
    }

    @CreateRequestContext()
    async process(job: Job<VideoCompressJobData>): Promise<void> {
        const { videoId } = job.data;
        const video = await this.em.findOne(Video, { id: videoId });
        if (!video) {
            this.logger.warn(`Video ${videoId} not found, skipping`);
            return;
        }

        // Skip compression for Cloudinary storage (Cloudinary handles transcoding)
        if (this.config.fileStorageMode !== 'local') {
            this.logger.log(`Video ${videoId}: skipping compression (cloudinary mode)`);
            return;
        }

        const publicId = video.video.public_id;
        if (!publicId) {
            this.logger.warn(`Video ${videoId} has no public_id, skipping`);
            return;
        }

        this.logger.log(`Compressing video ${videoId} (${publicId})...`);

        const result = await this.compressService.compress(publicId);

        video.video.size = result.size;
        if (result.duration !== undefined) {
            video.video.duration = result.duration;
        }

        // If format changed (e.g. .webm → .mp4), update URLs and public_id
        if (result.newPublicId) {
            const oldExt = '.' + (video.video.format || 'mp4');
            video.video.url = video.video.url.replace(new RegExp(`\\${oldExt}$`), '.mp4');
            video.video.secure_url = video.video.secure_url.replace(new RegExp(`\\${oldExt}$`), '.mp4');
            video.video.public_id = result.newPublicId;
        }
        video.video.format = 'mp4';

        await this.em.flush();
        this.logger.log(`Compressed video ${videoId}: ${result.size} bytes`);
    }
}
