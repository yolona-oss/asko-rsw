import { CreateRequestContext, EntityManager } from "@mikro-orm/postgresql";
import { Inject, Injectable } from "@nestjs/common";
import { VideoTypeEnum } from "@asko/shared";
import { Video } from './video.entity';
import { FileAccess } from 'common/file-access.entity';
import { AppErrors } from "common/error";
import { STORAGE_PROVIDER, StorageProvider } from "storage/storage-provider.interface";

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
    async findAccess(fileId: string): Promise<FileAccess | null> {
        return this.em.findOne(FileAccess, { fileId, fileType: 'video' });
    }

    @CreateRequestContext()
    async remove(id: string) {
        const video = await this.em.findOne(Video, { id });
        if (!video) throw AppErrors.dbEntityNotFound(`Video ${id} not found`);
        await this.storage.delete(video.video.public_id, 'video');
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
        if (!video) throw AppErrors.dbEntityNotFound(`Video ${videoId} not found`);
        video.ownerId = String(ownerId);
        video.ownerType = ownerType;
        video.order = await this.em.count(Video, { ownerId, ownerType });
        await this.em.persistAndFlush(video);
        return video;
    }

    @CreateRequestContext()
    async unattachVideo(videoId: string) {
        const video = await this.em.findOne(Video, { id: videoId });
        if (!video) throw AppErrors.dbEntityNotFound(`Video ${videoId} not found`);
        video.ownerId = undefined;
        video.ownerType = undefined;
        await this.em.persistAndFlush(video);
    }
}
