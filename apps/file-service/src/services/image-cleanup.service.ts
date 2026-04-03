import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { EntityManager, CreateRequestContext } from '@mikro-orm/postgresql';
import { Image } from 'entities/image.entity';
import { ImageTypeEnum } from '@asko/shared';
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

    /** Every day at 4 AM — clean unattached orphans and stale dangling images */
    @Cron('0 4 * * *')
    @CreateRequestContext()
    async cleanOrphanImages(): Promise<void> {
        const orphanCutoff = new Date(Date.now() - ORPHAN_AGE_MS);
        const staleCutoff = new Date(Date.now() - STALE_AGE_MS);

        // 1. Unattached images older than 24h
        const orphans = await this.em.find(Image, {
            ownerId: null,
            ownerType: null,
            createdAt: { $lt: orphanCutoff },
        }, { limit: 200 });

        // 2. Find stale owner groups — all images for a given (ownerType, ownerId)
        //    where the newest image in that group hasn't been updated in 30 days.
        //    This catches images whose targets were deleted without cleanup.
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

        for (const image of allToDelete) {
            try {
                const publicIds = Object.values(image.image)
                    .filter(Boolean)
                    .map((entry) => entry.public_id)
                    .filter(Boolean);

                if (publicIds.length > 0) {
                    await this.storage.deleteImages(publicIds);
                }
            } catch (e) {
                this.logger.error(`Failed to delete files for image ${image.id}: ${e}`);
            }

            this.em.remove(image);
        }

        await this.em.flush();
        this.logger.log(`Cleaned ${allToDelete.length} images total`);
    }

    /** Called by gRPC when an entity is deleted — immediately clean its images */
    @CreateRequestContext()
    async deleteByOwner(ownerType: ImageTypeEnum, ownerId: string): Promise<number> {
        const images = await this.em.find(Image, { ownerType, ownerId });
        if (images.length === 0) return 0;

        for (const image of images) {
            try {
                const publicIds = Object.values(image.image)
                    .filter(Boolean)
                    .map((entry) => entry.public_id)
                    .filter(Boolean);

                if (publicIds.length > 0) {
                    await this.storage.deleteImages(publicIds);
                }
            } catch (e) {
                this.logger.error(`Failed to delete files for image ${image.id}: ${e}`);
            }

            this.em.remove(image);
        }

        await this.em.flush();
        this.logger.log(`Deleted ${images.length} images for ${ownerType}/${ownerId}`);
        return images.length;
    }
}
