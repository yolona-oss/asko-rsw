import { CreateRequestContext, EntityManager } from "@mikro-orm/postgresql";
import { Inject, Injectable } from "@nestjs/common";
import { VideoTypeEnum, FileVisibility } from "@asko/shared";
import { Video } from 'entities/video.entity';
import { FileAccess } from 'entities/file-access.entity';
import { AppErrors } from "common/error";
import { STORAGE_PROVIDER, StorageProvider } from "storage/storage-provider.interface";
import 'multer';

@Injectable()
export class VideoService {
    constructor(
        private readonly em: EntityManager,
        @Inject(STORAGE_PROVIDER) private readonly storage: StorageProvider,
    ) { }

    @CreateRequestContext()
    async findOne(id: string): Promise<Video> {
        return this.em.findOneOrFail(Video, { id });
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

        if (creatorId || visibility || conversationId) {
            const access = new FileAccess();
            access.fileId = video.id;
            access.fileType = 'video';
            if (visibility) access.visibility = visibility as FileVisibility;
            if (creatorId) access.creatorId = creatorId;
            if (conversationId) access.conversationId = conversationId;
            this.em.persist(access);
            await this.em.flush();
        }

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
        return video;
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
