import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { EntityManager, CreateRequestContext } from '@mikro-orm/postgresql';
import { FileStorageMode } from '@asko/shared';
import { Video } from './video.entity';
import { VideoCompressService } from './video-compress.service';
import { STORAGE_PROVIDER, StorageProvider } from 'storage/storage-provider.interface';
import { AppConfig } from 'app.config';
import { VIDEO_COMPRESS_QUEUE } from './video.module';
import { safePath } from 'common/safe-path';
import * as fs from 'fs/promises';
import { createReadStream, createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import * as path from 'path';
import * as os from 'os';

export interface VideoCompressJobData {
    videoId: string;
}

/** Hardcoded regex for replacing the final file extension with .mp4 */
const EXT_TO_MP4_RE = /\.[^.]+$/;

@Processor(VIDEO_COMPRESS_QUEUE)
export class VideoCompressProcessor extends WorkerHost {
    private readonly logger = new Logger(VideoCompressProcessor.name);

    constructor(
        private readonly em: EntityManager,
        private readonly config: AppConfig,
        private readonly compressService: VideoCompressService,
        @Inject(STORAGE_PROVIDER) private readonly storage: StorageProvider,
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

        if (this.config.fileStorageMode === FileStorageMode.CLOUDINARY) {
            this.logger.log(`Video ${videoId}: skipping compression (cloudinary mode)`);
            return;
        }

        const publicId = video.video.public_id;
        if (!publicId) {
            this.logger.warn(`Video ${videoId} has no public_id, skipping`);
            return;
        }

        this.logger.log(`Compressing video ${videoId} (${publicId})...`);

        if (this.config.fileStorageMode === FileStorageMode.S3) {
            await this.processS3(video, publicId);
        } else {
            await this.processLocal(video, publicId);
        }

        await this.em.flush();
        this.logger.log(`Compressed video ${videoId}: ${video.video.size} bytes`);
    }

    private async processLocal(video: Video, publicId: string): Promise<void> {
        const result = await this.compressService.compress(publicId);
        video.video.size = result.size;
        if (result.duration !== undefined) video.video.duration = result.duration;

        if (result.newPublicId) {
            video.video.url = video.video.url.replace(EXT_TO_MP4_RE, '.mp4');
            video.video.secure_url = video.video.secure_url.replace(EXT_TO_MP4_RE, '.mp4');
            video.video.public_id = result.newPublicId;
        }
        video.video.format = 'mp4';
    }

    private async processS3(video: Video, publicId: string): Promise<void> {
        const tmpDir = await fs.mkdtemp(safePath(os.tmpdir(), 'video-compress-'));
        const ext = path.extname(publicId) || '.mp4';
        const inputPath = safePath(tmpDir, `input${ext}`);

        try {
            const s3Stream = await this.storage.download(publicId, 'video');
            await pipeline(s3Stream, createWriteStream(inputPath));

            const result = await this.compressService.compressPath(inputPath);

            const compressedStream = createReadStream(result.outputPath);
            const newKey = publicId.replace(EXT_TO_MP4_RE, '.mp4');

            await this.storage.upload(
                compressedStream,
                { originalname: path.basename(newKey), mimetype: 'video/mp4' },
                'video',
                '',
            );

            if (publicId !== newKey) {
                await this.storage.delete(publicId, 'video');
            }

            video.video.size = result.size;
            if (result.duration !== undefined) video.video.duration = result.duration;
            video.video.format = 'mp4';
            if (publicId !== newKey) {
                video.video.url = video.video.url.replace(EXT_TO_MP4_RE, '.mp4');
                video.video.secure_url = video.video.secure_url.replace(EXT_TO_MP4_RE, '.mp4');
                video.video.public_id = newKey;
            }
        } finally {
            await fs.rm(tmpDir, { recursive: true, force: true });
        }
    }
}
