import { CreateRequestContext, EntityManager } from "@mikro-orm/postgresql";
import { Inject, Injectable } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import { ImageTypeEnum, FileVisibility } from "@asko/shared";
import { Image } from 'entities/image.entity';
import { FileAccess } from 'entities/file-access.entity';
import { ImageObj } from "entities/image.obj";
import { AppErrors } from "common/error";
import { IMAGE_RESIZE_QUEUE } from "modules/image-resize-queue.module";
import { STORAGE_PROVIDER, StorageProvider } from "storage/storage-provider.interface";
import type { ImageResizeJobData } from "./image-resize.processor";
import 'multer';

const RESIZE_JOB_OPTS = {
    attempts: 3,
    backoff: { type: 'exponential' as const, delay: 5000 },
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 5000 },
};

interface AccessParams {
    creatorId?: string;
    visibility?: string;
    conversationId?: string;
}

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

    private async createFileAccess(fileId: string, params: AccessParams): Promise<void> {
        if (!params.creatorId && !params.visibility && !params.conversationId) return;
        const access = new FileAccess();
        access.fileId = fileId;
        access.fileType = 'image';
        if (params.visibility) access.visibility = params.visibility as FileVisibility;
        if (params.creatorId) access.creatorId = params.creatorId;
        if (params.conversationId) access.conversationId = params.conversationId;
        this.em.persist(access);
        await this.em.flush();
    }

    private async uploadOwned(
        file: Express.Multer.File,
        ownerType: ImageTypeEnum,
        ownerId: string,
        folder: string,
        access?: AccessParams,
    ): Promise<Image> {
        const original = await this.storage.uploadImage(file, folder);
        const image = new Image();
        image.image = { original };
        image.ownerType = ownerType;
        image.ownerId = String(ownerId);
        image.order = await this.countAttached(ownerId, ownerType);
        await this.em.persistAndFlush(image);
        await this.enqueueResize(image.id);
        if (access) await this.createFileAccess(image.id, access);
        return image;
    }

    @CreateRequestContext()
    async findOne(id: string): Promise<Image> {
        return this.em.findOneOrFail(Image, { id });
    }

    @CreateRequestContext()
    async upload(file: Express.Multer.File, alt?: string, access?: AccessParams) {
        const imageObj = await this.storage.uploadImage(file);
        const image = new Image();
        image.image = { original: imageObj };
        image.alt = alt;
        image.order = 0;
        await this.em.persistAndFlush(image);
        if (access) await this.createFileAccess(image.id, access);
        return image;
    }

    @CreateRequestContext()
    async streamUpload(file: Express.Multer.File, alt?: string, access?: AccessParams) {
        const imageObj = await this.storage.uploadStream(file.stream, file.mimetype);
        if (!imageObj) throw AppErrors.externalServiceUnavailable('Unable to upload image');
        const image = new Image();
        image.image = { original: imageObj };
        image.alt = alt;
        image.order = 0;
        await this.em.persistAndFlush(image);
        if (access) await this.createFileAccess(image.id, access);
        return image;
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
    async uploadUserAvatar(file: Express.Multer.File, ownerId: string, access?: AccessParams) {
        // Remove existing avatars before uploading new one
        const existing = await this.em.find(Image, { ownerType: ImageTypeEnum.User, ownerId: String(ownerId) });
        for (const old of existing) this.remove(old.id);
        return this.uploadOwned(file, ImageTypeEnum.User, ownerId, 'avatars', access);
    }

    @CreateRequestContext()
    async uploadDeviceImage(file: Express.Multer.File, ownerId: string, access?: AccessParams) {
        return this.uploadOwned(file, ImageTypeEnum.Device, ownerId, 'devices', access);
    }

    @CreateRequestContext()
    async uploadArticleImage(file: Express.Multer.File, ownerId: string, access?: AccessParams) {
        return this.uploadOwned(file, ImageTypeEnum.Article, ownerId, 'articles', access);
    }

    @CreateRequestContext()
    async uploadRepairRequestImage(file: Express.Multer.File, ownerId: string, access?: AccessParams) {
        return this.uploadOwned(file, ImageTypeEnum.RepairRequest, ownerId, 'repairs', access);
    }

    @CreateRequestContext()
    async uploadReviewImage(file: Express.Multer.File, ownerId: string, access?: AccessParams) {
        return this.uploadOwned(file, ImageTypeEnum.Review, ownerId, 'reviews', access);
    }

    @CreateRequestContext()
    async uploadDevicePartImage(file: Express.Multer.File, ownerId: string, access?: AccessParams) {
        return this.uploadOwned(file, ImageTypeEnum.DevicePart, ownerId, 'device-parts', access);
    }

    @CreateRequestContext()
    async uploadBrokenPartImage(file: Express.Multer.File, ownerId: string, access?: AccessParams) {
        return this.uploadOwned(file, ImageTypeEnum.BrokenPart, ownerId, 'broken-parts', access);
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
        return this.findAttachedImages(ownerType, ownerId);
    }

    @CreateRequestContext()
    async remove(id: string) {
        const image = await this.em.findOne(Image, { id });
        if (!image) throw AppErrors.dbEntityNotFound(`Image ${id} not found`);
        this.storage.deleteImage(image.id);
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
