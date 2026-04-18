import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { EntityManager, CreateRequestContext } from '@mikro-orm/postgresql';
import { Image } from 'image/image.entity';
import { ImageTypeEnum } from '@asko/shared';
import { collectPublicIds } from 'image/image-utils';
import { STORAGE_PROVIDER, StorageProvider } from 'storage/storage-provider.interface';

const ORPHAN_AGE_MS = 24 * 60 * 60 * 1000;
const STALE_AGE_MS = 30 * 24 * 60 * 60 * 1000;

@Injectable()
export class ImageCleanupService {
    private readonly logger = new Logger(ImageCleanupService.name);

    constructor(
        private readonly em: EntityManager,
        @Inject(STORAGE_PROVIDER) private readonly storage: StorageProvider,
    ) {}

    @Cron('0 4 * * *')
    @CreateRequestContext()
    async cleanOrphanImages(): Promise<void> {
        const orphanCutoff = new Date(Date.now() - ORPHAN_AGE_MS);
        const staleCutoff = new Date(Date.now() - STALE_AGE_MS);

        const orphans = await this.em.find(Image, {
            ownerId: null,
            ownerType: null,
            createdAt: { $lt: orphanCutoff },
        }, { limit: 200 });

        const staleOwners = await this.em.getConnection().execute<
            { owner_type: string; owner_id: string }[]
        >(`
            select owner_type, owner_id
            from image
            where owner_id is not null and owner_type is not null
            group by owner_type, owner_id
            having max(updated_at) < $1
            limit 50
        `, [staleCutoff]);

        let staleImages: Image[] = [];
        if (staleOwners.length > 0) {
            staleImages = await this.em.find(Image, {
                $or: staleOwners.map((s) => ({
                    ownerType: s.owner_type as ImageTypeEnum,
                    ownerId: s.owner_id,
                })),
            });
        }

        const allToDelete = [...orphans, ...staleImages];
        if (allToDelete.length === 0) return;

        this.logger.log(`Cleaning ${orphans.length} orphans + ${staleImages.length} stale images`);
        await this.deleteImageEntities(allToDelete);
        this.logger.log(`Cleaned ${allToDelete.length} images total`);
    }

    @CreateRequestContext()
    async deleteByOwner(ownerType: ImageTypeEnum, ownerId: string): Promise<number> {
        const images = await this.em.find(Image, { ownerType, ownerId });
        if (images.length === 0) return 0;

        await this.deleteImageEntities(images);
        this.logger.log(`Deleted ${images.length} images for ${ownerType}/${ownerId}`);
        return images.length;
    }

    private async deleteImageEntities(images: Image[]): Promise<void> {
        for (const image of images) {
            const publicIds = collectPublicIds(image);
            if (publicIds.length > 0) {
                await this.storage.deleteBatch(publicIds, 'image');
            }
            this.em.remove(image);
        }
        await this.em.flush();
    }
}
