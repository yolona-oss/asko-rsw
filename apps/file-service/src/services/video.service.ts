import { CreateRequestContext, EntityManager } from "@mikro-orm/postgresql";
import { Inject, Injectable } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import { VideoTypeEnum } from "@asko/shared";
import { Video } from 'entities/video.entity';
import { FileAccess } from 'entities/file-access.entity';
import { AppErrors } from "common/error";
import { AccessParams, persistFileAccess, toAccessParams } from "common/file-access.helper";
import { STORAGE_PROVIDER, StorageProvider, StreamUploadMeta } from "storage/storage-provider.interface";
import { VIDEO_COMPRESS_QUEUE } from "modules/video-compress-queue.module";
import type { VideoCompressJobData } from "./video-compress.processor";
import 'multer';

const COMPRESS_JOB_OPTS = {
    attempts: 3,
    backoff: { type: 'exponential' as const, delay: 5000 },
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 5000 },
};

@Injectable()
export class VideoService {
    constructor(
        private readonly em: EntityManager,
        @Inject(STORAGE_PROVIDER) private readonly storage: StorageProvider,
        @InjectQueue(VIDEO_COMPRESS_QUEUE) private readonly compressQueue: Queue<VideoCompressJobData>,
    ) { }

    private async enqueueCompress(videoId: string): Promise<void> {
        await this.compressQueue.add('compress', { videoId }, COMPRESS_JOB_OPTS);
    }

    @CreateRequestContext()
    async findOne(id: string): Promise<Video> {
        return this.em.findOneOrFail(Video, { id });
    }

    @CreateRequestContext()
    async findAccess(fileId: string): Promise<FileAccess | null> {
        return this.em.findOne(FileAccess, { fileId, fileType: 'video' });
    }

    @CreateRequestContext()
    async upload(
        file: Express.Multer.File,
        creatorId?: string,
        visibility?: string,
        conversationId?: string,
    ) {
        const result = await this.storage.uploadVideo(file);
        const video = new Video();
        video.video = result;
        video.order = 0;
        await this.em.persistAndFlush(video);
        await this.enqueueCompress(video.id);

        await persistFileAccess(
            this.em,
            video.id,
            'video',
            toAccessParams({ creatorId, visibility, conversationId }),
        );

        return video;
    }

    @CreateRequestContext()
    async uploadRepairRequestVideo(file: Express.Multer.File, ownerId: string) {
        const result = await this.storage.uploadVideo(file, 'repair-request-videos');
        const video = new Video();
        video.video = result;
        video.ownerType = VideoTypeEnum.RepairRequest;
        video.ownerId = String(ownerId);
        video.order = await this.countAttached(ownerId, VideoTypeEnum.RepairRequest);
        await this.em.persistAndFlush(video);
        await this.enqueueCompress(video.id);
        return video;
    }

    @CreateRequestContext()
    async uploadReviewVideo(file: Express.Multer.File, ownerId: string) {
        const result = await this.storage.uploadVideo(file, 'review-videos');
        const video = new Video();
        video.video = result;
        video.ownerType = VideoTypeEnum.Review;
        video.ownerId = String(ownerId);
        video.order = await this.countAttached(ownerId, VideoTypeEnum.Review);
        await this.em.persistAndFlush(video);
        await this.enqueueCompress(video.id);
        return video;
    }

    @CreateRequestContext()
    async uploadDeviceVideo(file: Express.Multer.File, ownerId: string) {
        const result = await this.storage.uploadVideo(file, 'device-videos');
        const video = new Video();
        video.video = result;
        video.ownerType = VideoTypeEnum.Device;
        video.ownerId = String(ownerId);
        video.order = await this.countAttached(ownerId, VideoTypeEnum.Device);
        await this.em.persistAndFlush(video);
        await this.enqueueCompress(video.id);
        return video;
    }

    @CreateRequestContext()
    async uploadArticleVideo(file: Express.Multer.File, ownerId: string) {
        const result = await this.storage.uploadVideo(file, 'article-videos');
        const video = new Video();
        video.video = result;
        video.ownerType = VideoTypeEnum.Article;
        video.ownerId = String(ownerId);
        video.order = await this.countAttached(ownerId, VideoTypeEnum.Article);
        await this.em.persistAndFlush(video);
        await this.enqueueCompress(video.id);
        return video;
    }

    private async uploadOwnedVideoStream(
        stream: NodeJS.ReadableStream,
        meta: StreamUploadMeta,
        ownerType: VideoTypeEnum,
        ownerId: string,
        folder: string,
        access?: AccessParams,
    ): Promise<Video> {
        const result = await this.storage.uploadVideoStream(stream, meta, folder);
        const video = new Video();
        video.video = result;
        video.ownerType = ownerType;
        video.ownerId = String(ownerId);
        video.order = await this.countAttached(ownerId, ownerType);
        await this.em.persistAndFlush(video);
        await this.enqueueCompress(video.id);
        await persistFileAccess(this.em, video.id, 'video', access);
        return video;
    }

    @CreateRequestContext()
    async uploadStreamGeneric(
        stream: NodeJS.ReadableStream,
        meta: StreamUploadMeta,
        access?: AccessParams,
    ): Promise<Video> {
        const result = await this.storage.uploadVideoStream(stream, meta);
        const video = new Video();
        video.video = result;
        video.order = 0;
        await this.em.persistAndFlush(video);
        await this.enqueueCompress(video.id);

        await persistFileAccess(this.em, video.id, 'video', access);

        return video;
    }

    @CreateRequestContext()
    async uploadRepairRequestVideoStream(
        stream: NodeJS.ReadableStream, meta: StreamUploadMeta, ownerId: string, access?: AccessParams,
    ) {
        return this.uploadOwnedVideoStream(stream, meta, VideoTypeEnum.RepairRequest, ownerId, 'repair-request-videos', access);
    }

    @CreateRequestContext()
    async uploadReviewVideoStream(
        stream: NodeJS.ReadableStream, meta: StreamUploadMeta, ownerId: string, access?: AccessParams,
    ) {
        return this.uploadOwnedVideoStream(stream, meta, VideoTypeEnum.Review, ownerId, 'review-videos', access);
    }

    @CreateRequestContext()
    async uploadDeviceVideoStream(
        stream: NodeJS.ReadableStream, meta: StreamUploadMeta, ownerId: string, access?: AccessParams,
    ) {
        return this.uploadOwnedVideoStream(stream, meta, VideoTypeEnum.Device, ownerId, 'device-videos', access);
    }

    @CreateRequestContext()
    async uploadArticleVideoStream(
        stream: NodeJS.ReadableStream, meta: StreamUploadMeta, ownerId: string, access?: AccessParams,
    ) {
        return this.uploadOwnedVideoStream(stream, meta, VideoTypeEnum.Article, ownerId, 'article-videos', access);
    }

    @CreateRequestContext()
    async remove(id: string) {
        const video = await this.em.findOne(Video, { id });
        if (!video) {
            throw AppErrors.dbEntityNotFound(`Video ${id} not found`);
        }
        await this.storage.deleteVideo(video.video.public_id);
        await this.em.removeAndFlush(video);
    }

    @CreateRequestContext()
    async findAttachedVideos(ownerType: VideoTypeEnum, ownerId: string) {
        return await this.em.find(Video,
            { ownerType, ownerId },
            { orderBy: { order: 'ASC' } },
        );
    }

    @CreateRequestContext()
    async attachVideo(videoId: string, ownerType: VideoTypeEnum, ownerId: string) {
        const video = await this.em.findOne(Video, { id: videoId });
        if (!video) {
            throw AppErrors.dbEntityNotFound(`Video ${videoId} not found`);
        }
        video.ownerId = String(ownerId);
        video.ownerType = ownerType;
        video.order = await this.countAttached(ownerId, ownerType);
        await this.em.persistAndFlush(video);
        return video;
    }

    @CreateRequestContext()
    async unattachVideo(videoId: string) {
        const video = await this.em.findOne(Video, { id: videoId });
        if (!video) {
            throw AppErrors.dbEntityNotFound(`Video ${videoId} not found`);
        }
        video.ownerId = undefined;
        video.ownerType = undefined;
        await this.em.persistAndFlush(video);
    }

    @CreateRequestContext()
    async countAttached(ownerId: string, ownerType: VideoTypeEnum) {
        return await this.em.count(Video, { ownerId, ownerType });
    }
}
