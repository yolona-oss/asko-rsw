import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { EntityManager, CreateRequestContext } from '@mikro-orm/postgresql';
import { Image } from 'entities/image.entity';
import { STORAGE_PROVIDER, StorageProvider } from 'storage/storage-provider.interface';

/** Delete images not attached to any owner after 24 hours */
const ORPHAN_AGE_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class ImageCleanupService {
    private readonly logger = new Logger(ImageCleanupService.name);

    constructor(
        private readonly em: EntityManager,
        @Inject(STORAGE_PROVIDER) private readonly storage: StorageProvider,
    ) {}

    /** Every day at 4 AM */
    @Cron('0 4 * * *')
    @CreateRequestContext()
    async cleanOrphanImages(): Promise<void> {
        const cutoff = new Date(Date.now() - ORPHAN_AGE_MS);

        const orphans = await this.em.find(Image, {
            ownerId: null,
            ownerType: null,
            createdAt: { $lt: cutoff },
        }, { limit: 200 });

        if (orphans.length === 0) return;

        this.logger.log(`Cleaning ${orphans.length} orphan images`);

        for (const image of orphans) {
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
        this.logger.log(`Cleaned ${orphans.length} orphan images`);
    }
}
