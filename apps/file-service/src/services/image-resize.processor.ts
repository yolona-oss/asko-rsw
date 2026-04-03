import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { EntityManager, CreateRequestContext } from '@mikro-orm/postgresql';
import { Image } from 'entities/image.entity';
import { CloudinaryUploadResult } from './cloudinary.service';
import { ImageResizeService } from './image-resize.service';
import { STORAGE_PROVIDER, StorageProvider } from 'storage/storage-provider.interface';
import { AppConfig } from 'app.config';
import { getSizesForType, type ResizeSizeConfig } from 'common/resize-config';
import { IMAGE_RESIZE_QUEUE } from 'modules/image-resize-queue.module';

export interface ImageResizeJobData {
    imageId: string;
}

@Processor(IMAGE_RESIZE_QUEUE)
export class ImageResizeProcessor extends WorkerHost {
    private readonly logger = new Logger(ImageResizeProcessor.name);

    constructor(
        private readonly em: EntityManager,
        private readonly config: AppConfig,
        private readonly resizeService: ImageResizeService,
        @Inject(STORAGE_PROVIDER) private readonly storage: StorageProvider,
    ) {
        super();
    }

    @CreateRequestContext()
    async process(job: Job<ImageResizeJobData>): Promise<void> {
        const { imageId } = job.data;
        const image = await this.em.findOne(Image, { id: imageId });
        if (!image) {
            this.logger.warn(`Image ${imageId} not found, skipping`);
            return;
        }

        const original = image.image.original;
        const sizes = getSizesForType(image.ownerType, image.order);

        if (this.config.fileStorageMode === 'local') {
            await this.processLocal(image, original, sizes);
        } else {
            this.processCloudinary(image, original, sizes);
        }

        await this.em.flush();
        this.logger.log(`Resized image ${imageId} (${image.ownerType ?? 'generic'}): ${sizes.map(s => s.name).join(', ')}`);
    }

    private async processLocal(image: Image, original: CloudinaryUploadResult, sizes: ResizeSizeConfig[]): Promise<void> {
        const resized = await this.resizeService.generateSizes(original.public_id, sizes);
        for (const size of sizes) {
            const result = resized[size.name];
            if (result) {
                image.image[size.name] = result;
            }
        }
    }

    private processCloudinary(image: Image, original: CloudinaryUploadResult, sizes: ResizeSizeConfig[]): void {
        for (const size of sizes) {
            if (original.width === size.width && original.height === size.height) {
                image.image[size.name] = { ...original };
            } else {
                const url = this.storage.generateSizedUrl(
                    original.secure_url,
                    size.width,
                    size.height,
                    size.fit,
                );
                image.image[size.name] = {
                    ...original,
                    secure_url: url,
                    url,
                    width: size.width,
                    height: size.height,
                };
            }
        }
    }
}
