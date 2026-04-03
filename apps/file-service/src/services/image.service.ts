import { CreateRequestContext, EntityManager } from "@mikro-orm/postgresql";
import { Inject, Injectable } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import { ImageTypeEnum } from "@asko/shared";
import { Image } from 'entities/image.entity';
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

    @CreateRequestContext()
    async upload(file: Express.Multer.File, alt?: string) {
        const imageObj = await this.storage.uploadImage(file);
        const image = new Image();
        image.image = { original: imageObj };
        image.alt = alt;
        image.order = 0;
        await this.em.persistAndFlush(image);
        return image;
    }

    @CreateRequestContext()
    async streamUpload(file: Express.Multer.File, alt?: string) {
        const imageObj = await this.storage.uploadStream(file.stream, file.mimetype);
        if (!imageObj) {
            throw AppErrors.externalServiceUnavailable('Unable to upload image');
        }
        const image = new Image();
        image.image = { original: imageObj };
        image.alt = alt;
        image.order = 0;
        await this.em.persistAndFlush(image);
        return image;
    }

    @CreateRequestContext()
    async createFromUrl(url: string, ownerType?: ImageTypeEnum, ownerId?: string, order?: number): Promise<Image> {
        const defaultEntry = {
            public_id: 'external',
            version: 1,
            signature: '',
            width: 0,
            height: 0,
            format: '',
            resource_type: 'image',
            url,
            secure_url: url,
            original_filename: '',
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
    async uploadUserAvatar(file: Express.Multer.File, ownerId: string) {
        const existing = await this.em.find(Image, {
            ownerType: ImageTypeEnum.User,
            ownerId: String(ownerId),
        });
        for (const old of existing) {
            this.em.remove(old);
        }

        const original = await this.storage.uploadImage(file, 'avatars');
        const image = new Image();
        image.image = { original };
        image.ownerType = ImageTypeEnum.User;
        image.ownerId = String(ownerId);
        image.order = 0;

        await this.em.persistAndFlush(image);
        await this.enqueueResize(image.id);
        return image;
    }

    @CreateRequestContext()
    async uploadDeviceImage(file: Express.Multer.File, ownerId: string) {
        const original = await this.storage.uploadImage(file, 'devices');
        const image = new Image();
        image.image = { original };
        image.ownerType = ImageTypeEnum.Device;
        image.ownerId = String(ownerId);
        image.order = await this.countAttached(ownerId, ImageTypeEnum.Device);

        await this.em.persistAndFlush(image);
        await this.enqueueResize(image.id);
        return image;
    }

    @CreateRequestContext()
    async uploadArticleImage(file: Express.Multer.File, ownerId: string) {
        const original = await this.storage.uploadImage(file, 'articles');
        const image = new Image();
        image.image = { original };
        image.ownerType = ImageTypeEnum.Article;
        image.ownerId = String(ownerId);
        image.order = await this.countAttached(ownerId, ImageTypeEnum.Article);

        await this.em.persistAndFlush(image);
        await this.enqueueResize(image.id);
        return image;
    }

    @CreateRequestContext()
    async uploadRepairRequestImage(file: Express.Multer.File, ownerId: string) {
        const original = await this.storage.uploadImage(file, 'repairs');
        const image = new Image();
        image.image = { original };
        image.ownerType = ImageTypeEnum.RepairRequest;
        image.ownerId = String(ownerId);
        image.order = await this.countAttached(ownerId, ImageTypeEnum.RepairRequest);

        await this.em.persistAndFlush(image);
        await this.enqueueResize(image.id);
        return image;
    }

    @CreateRequestContext()
    async uploadReviewImage(file: Express.Multer.File, ownerId: string) {
        const original = await this.storage.uploadImage(file, 'reviews');
        const image = new Image();
        image.image = { original };
        image.ownerType = ImageTypeEnum.Review;
        image.ownerId = String(ownerId);
        image.order = await this.countAttached(ownerId, ImageTypeEnum.Review);

        await this.em.persistAndFlush(image);
        await this.enqueueResize(image.id);
        return image;
    }

    @CreateRequestContext()
    async uploadDevicePartImage(file: Express.Multer.File, ownerId: string) {
        const original = await this.storage.uploadImage(file, 'device-parts');
        const image = new Image();
        image.image = { original };
        image.ownerType = ImageTypeEnum.DevicePart;
        image.ownerId = String(ownerId);
        image.order = await this.countAttached(ownerId, ImageTypeEnum.DevicePart);

        await this.em.persistAndFlush(image);
        await this.enqueueResize(image.id);
        return image;
    }

    @CreateRequestContext()
    async uploadBrokenPartImage(file: Express.Multer.File, ownerId: string) {
        const original = await this.storage.uploadImage(file, 'broken-parts');
        const image = new Image();
        image.image = { original };
        image.ownerType = ImageTypeEnum.BrokenPart;
        image.ownerId = String(ownerId);
        image.order = await this.countAttached(ownerId, ImageTypeEnum.BrokenPart);

        await this.em.persistAndFlush(image);
        await this.enqueueResize(image.id);
        return image;
    }

    @CreateRequestContext()
    async reorderImages(ownerType: ImageTypeEnum, ownerId: string, schema: { id: string; order: number }[]) {
        const targets = await this.findAttachedImages(ownerType, ownerId);

        schema.sort((a, b) => a.order - b.order);

        if (targets.length < schema.length) {
            throw AppErrors.badRequest('Input order schema is invalid: not enough source images');
        }

        const isUniq = (a: any[]) => a.length === new Set(a).size;
        const ids = schema.map(i => i.id);
        const order_nums = schema.map(i => i.order);
        if (!isUniq(ids) || !isUniq(order_nums)) {
            throw AppErrors.badRequest('Input order schema is invalid');
        }

        if (schema[schema.length - 1].order > Math.max(...targets.map(i => i.order))) {
            throw AppErrors.badRequest('Input order schema is invalid: too big order number');
        }

        const swapImages = (a: Image, b: Image) => {
            const tmp = a.order;
            a.order = b.order;
            b.order = tmp;
        };

        const ignore: string[] = [];
        for (const schemaItem of schema) {
            if (ignore.includes(schemaItem.id)) continue;

            const image = targets.find(i => i.id === schemaItem.id);
            if (!image) throw AppErrors.dbEntityNotFound(`Image ${schemaItem.id} not found`);

            const pair = targets.find(i => i.order === schemaItem.order);
            if (pair) {
                ignore.push(pair.id);
                swapImages(pair, image);
            } else {
                throw AppErrors.badRequest('Input order schema is invalid: not enough target images');
            }
        }

        await this.em.persistAndFlush(targets);
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
        for (let i = 0; i < attachedImages.length; i++) {
            attachedImages[i].order = i;
        }

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
