import { CreateRequestContext, EntityManager } from "@mikro-orm/postgresql";
import { Inject, Injectable } from "@nestjs/common";
import { ImageTypeEnum, IImageEntry } from "@asko/shared";
import { Image } from 'image/image.entity';
import { FileAccess } from 'common/file-access.entity';
import { ImageObj } from "image/image.obj";
import { AppErrors } from "common/error";
import { msg } from "@asko/shared";
import { collectPublicIds } from "image/image-utils";
import { STORAGE_PROVIDER, StorageProvider } from "storage/storage-provider.interface";

@Injectable()
export class ImageService {
    constructor(
        private readonly em: EntityManager,
        @Inject(STORAGE_PROVIDER) private readonly storage: StorageProvider,
    ) { }

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
        const defaultEntry: IImageEntry = {
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
    async reorderImages(ownerType: ImageTypeEnum, ownerId: string, schema: { id: string; order: number }[]) {
        const images = await this.findAttachedImages(ownerType, ownerId);
        const map = new Map(images.map(img => [img.id, img]));

        for (const { id, order } of schema) {
            const img = map.get(id);
            if (!img) throw AppErrors.dbEntityNotFound({ key: msg.file.imageNotFound });
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
        if (!image) throw AppErrors.dbEntityNotFound({ key: msg.file.imageNotFound });
        const ids = collectPublicIds(image);
        if (ids.length > 0) await this.storage.deleteBatch(ids, 'image');
        await this.em.removeAndFlush(image);
    }

    @CreateRequestContext()
    async unattachImage(imageId: string) {
        const image = await this.em.findOne(Image, { id: imageId });
        if (!image) throw AppErrors.dbEntityNotFound({ key: msg.file.imageNotFound });
        if (!image.ownerType || !image.ownerId) throw AppErrors.badRequest({ key: msg.file.imageNotAttached });
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
        if (!image) throw AppErrors.dbEntityNotFound({ key: msg.file.imageNotFound });
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
