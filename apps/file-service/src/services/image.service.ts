import { CreateRequestContext, EntityManager } from "@mikro-orm/postgresql";
import { Inject, Injectable } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import { ImageTypeEnum } from "@asko/shared";
import { Image } from 'entities/image.entity';
import { FileAccess } from 'entities/file-access.entity';
import { ImageObj } from "entities/image.obj";
import { AppErrors } from "common/error";
import { AccessParams, persistFileAccess } from "common/file-access.helper";
import { collectPublicIds } from "common/image-utils";
import { IMAGE_RESIZE_QUEUE } from "modules/image-resize-queue.module";
import { STORAGE_PROVIDER, StorageProvider, StreamUploadMeta } from "storage/storage-provider.interface";
import type { ImageResizeJobData } from "./image-resize.processor";

const RESIZE_JOB_OPTS = {
    attempts: 3,
    backoff: { type: 'exponential' as const, delay: 5000 },
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 5000 },
};

@Injectable()
export class ImageService {
    constructor(
        private readonly em: EntityManager,
        @Inject(STORAGE_PROVIDER) private readonly storage: StorageProvider,
        @InjectQueue(IMAGE_RESIZE_QUEUE) private readonly resizeQueue: Queue<ImageResizeJobData>,
    ) { }

    private async enqueueResize(imageId: string): Promise<void> {
        await this.resizeQueue.add('resize', { imageId }, RESIZE_JOB_OPTS);
    }

    private async uploadOwnedStream(
        stream: NodeJS.ReadableStream,
        meta: StreamUploadMeta,
        ownerType: ImageTypeEnum,
        ownerId: string,
        folder: string,
        access?: AccessParams,
    ): Promise<Image> {
        const original = await this.storage.uploadImageStream(stream, meta, folder);
        const image = new Image();
        image.image = { original };
        image.ownerType = ownerType;
        image.ownerId = String(ownerId);
        image.order = await this.countAttached(ownerId, ownerType);
        await this.em.persistAndFlush(image);
        await this.enqueueResize(image.id);
        await persistFileAccess(this.em, image.id, 'image', access);
        return image;
    }

    @CreateRequestContext()
    async findOne(id: string): Promise<Image> {
        return this.em.findOneOrFail(Image, { id });
    }

    @CreateRequestContext()
    async findAccess(fileId: string): Promise<FileAccess | null> {
        return this.em.findOne(FileAccess, { fileId, fileType: 'image' });
    }

    @CreateRequestContext()
    async createFromUrl(url: string, ownerType?: ImageTypeEnum, ownerId?: string, order?: number): Promise<Image> {
        const defaultEntry = {
            public_id: 'external', version: 1, signature: '', width: 0, height: 0,
            format: '', resource_type: 'image', url, secure_url: url, original_filename: '',
        };
        const image = new Image();
        image.image = { original: defaultEntry } as ImageObj;
        if (ownerType) image.ownerType = ownerType;
        if (ownerId) image.ownerId = ownerId;
        image.order = order ?? 0;
        await this.em.persistAndFlush(image);
        return image;
    }

    @CreateRequestContext()
    async uploadUserAvatarStream(stream: NodeJS.ReadableStream, meta: StreamUploadMeta, ownerId: string, access?: AccessParams) {
        const existing = await this.em.find(Image, { ownerType: ImageTypeEnum.User, ownerId: String(ownerId) });
        for (const old of existing) {
            const ids = collectPublicIds(old);
            if (ids.length > 0) await this.storage.deleteImages(ids);
            this.em.remove(old);
        }
        if (existing.length > 0) await this.em.flush();
        return this.uploadOwnedStream(stream, meta, ImageTypeEnum.User, ownerId, 'avatars', access);
    }

    @CreateRequestContext()
    async uploadDeviceImageStream(stream: NodeJS.ReadableStream, meta: StreamUploadMeta, ownerId: string, access?: AccessParams) {
        return this.uploadOwnedStream(stream, meta, ImageTypeEnum.Device, ownerId, 'devices', access);
    }

    @CreateRequestContext()
    async uploadArticleImageStream(stream: NodeJS.ReadableStream, meta: StreamUploadMeta, ownerId: string, access?: AccessParams) {
        return this.uploadOwnedStream(stream, meta, ImageTypeEnum.Article, ownerId, 'articles', access);
    }

    @CreateRequestContext()
    async uploadRepairRequestImageStream(stream: NodeJS.ReadableStream, meta: StreamUploadMeta, ownerId: string, access?: AccessParams) {
        return this.uploadOwnedStream(stream, meta, ImageTypeEnum.RepairRequest, ownerId, 'repairs', access);
    }

    @CreateRequestContext()
    async uploadReviewImageStream(stream: NodeJS.ReadableStream, meta: StreamUploadMeta, ownerId: string, access?: AccessParams) {
        return this.uploadOwnedStream(stream, meta, ImageTypeEnum.Review, ownerId, 'reviews', access);
    }

    @CreateRequestContext()
    async uploadDevicePartImageStream(stream: NodeJS.ReadableStream, meta: StreamUploadMeta, ownerId: string, access?: AccessParams) {
        return this.uploadOwnedStream(stream, meta, ImageTypeEnum.DevicePart, ownerId, 'device-parts', access);
    }

    @CreateRequestContext()
    async uploadBrokenPartImageStream(stream: NodeJS.ReadableStream, meta: StreamUploadMeta, ownerId: string, access?: AccessParams) {
        return this.uploadOwnedStream(stream, meta, ImageTypeEnum.BrokenPart, ownerId, 'broken-parts', access);
    }

    @CreateRequestContext()
    async uploadStreamGeneric(stream: NodeJS.ReadableStream, meta: StreamUploadMeta, access?: AccessParams) {
        const original = await this.storage.uploadImageStream(stream, meta);
        const image = new Image();
        image.image = { original };
        image.alt = meta.alt;
        image.order = 0;
        await this.em.persistAndFlush(image);
        await this.enqueueResize(image.id);
        await persistFileAccess(this.em, image.id, 'image', access);
        return image;
    }

    @CreateRequestContext()
    async reorderImages(ownerType: ImageTypeEnum, ownerId: string, schema: { id: string; order: number }[]) {
        const images = await this.findAttachedImages(ownerType, ownerId);
        const map = new Map(images.map(img => [img.id, img]));

        for (const { id, order } of schema) {
            const img = map.get(id);
            if (!img) throw AppErrors.dbEntityNotFound(`Image ${id} not found`);
            img.order = order;
        }

        await this.em.flush();
    }

    @CreateRequestContext()
    async reorderByIds(ownerType: ImageTypeEnum, ownerId: string, imageIds: string[]) {
        const images = await this.findAttachedImages(ownerType, ownerId);
        const map = new Map(images.map(img => [img.id, img]));

        for (let i = 0; i < imageIds.length; i++) {
            const img = map.get(imageIds[i]);
            if (img) img.order = i;
        }

        await this.em.flush();
        return images.sort((a, b) => a.order - b.order);
    }

    @CreateRequestContext()
    async remove(id: string) {
        const image = await this.em.findOne(Image, { id });
        if (!image) throw AppErrors.dbEntityNotFound(`Image ${id} not found`);
        const ids = collectPublicIds(image);
        if (ids.length > 0) await this.storage.deleteImages(ids);
        await this.em.removeAndFlush(image);
    }

    @CreateRequestContext()
    async unattachImage(imageId: string) {
        const image = await this.em.findOne(Image, { id: imageId });
        if (!image) throw AppErrors.dbEntityNotFound(`Image ${imageId} not found`);
        if (!image.ownerType || !image.ownerId) throw AppErrors.badRequest(`Image ${imageId} not attached`);
        const prevOwnerType = image.ownerType;
        const prevOwnerId = image.ownerId;
        image.ownerId = undefined;
        image.ownerType = undefined;
        const attachedImages = await this.findAttachedImages(prevOwnerType, prevOwnerId);
        for (let i = 0; i < attachedImages.length; i++) attachedImages[i].order = i;
        await this.em.flush();
    }

    @CreateRequestContext()
    async attachImage(imageId: string, ownerType: ImageTypeEnum, ownerId: string) {
        const image = await this.em.findOne(Image, { id: imageId });
        if (!image) throw AppErrors.dbEntityNotFound(`Image ${imageId} not found`);
        image.ownerId = String(ownerId);
        image.ownerType = ownerType;
        image.order = await this.countAttached(image.ownerId, image.ownerType);
        await this.em.persistAndFlush(image);
        return image;
    }

    @CreateRequestContext()
    async countAttached(ownerId: string, ownerType: ImageTypeEnum) {
        return await this.em.count(Image, { ownerId, ownerType });
    }

    @CreateRequestContext()
    async findAttachedImages(ownerType: ImageTypeEnum, ownerId: string) {
        return await this.em.find(Image, { ownerType, ownerId }, { orderBy: { order: 'ASC' } });
    }
}
