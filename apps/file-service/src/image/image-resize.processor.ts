import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { EntityManager, CreateRequestContext } from '@mikro-orm/postgresql';
import { FileStorageMode, IImageEntry } from '@asko/shared';
import sharp from 'sharp';
import { Image } from 'image/image.entity';
import { ImageResizeService } from './image-resize.service';
import { STORAGE_PROVIDER, StorageProvider } from 'storage/storage-provider.interface';
import { AppConfig } from 'app.config';
import { getSizesForType, type ResizeSizeConfig } from 'image/resize-config';
import { IMAGE_RESIZE_QUEUE } from 'image/image.module';

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

        switch (this.config.fileStorageMode) {
            case FileStorageMode.LOCAL:
                await this.processLocal(image, original, sizes);
                break;
            case FileStorageMode.S3:
                await this.processS3(image, original, sizes);
                break;
            default:
                this.processCloudinary(image, original, sizes);
                break;
        }

        await this.em.flush();
        this.logger.log(`Resized image ${imageId} (${image.ownerType ?? 'generic'}): ${sizes.map(s => s.name).join(', ')}`);
    }

    private async processLocal(image: Image, original: IImageEntry, sizes: ResizeSizeConfig[]): Promise<void> {
        const resized = await this.resizeService.generateSizes(original.public_id, sizes);
        for (const size of sizes) {
            const result = resized[size.name];
            if (result) {
                image.image[size.name] = result;
            }
        }

        const compressed = await this.resizeService.compressOriginal(original.public_id);
        image.image.original = {
            ...original,
            width: compressed.width,
            height: compressed.height,
        };
    }

    private async processS3(image: Image, original: IImageEntry, sizes: ResizeSizeConfig[]): Promise<void> {
        const stream = await this.storage.download(original.public_id, 'image');

        const chunks: Buffer[] = [];
        for await (const chunk of stream) {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        }
        const buffer = Buffer.concat(chunks);
        const ext = original.format || 'jpg';
        const contentType = `image/${ext}`;

        const pipeline = sharp(buffer);

        for (const size of sizes) {
            if (original.width === size.width && original.height === size.height) {
                image.image[size.name] = { ...original };
                continue;
            }

            const resized = await pipeline.clone()
                .resize(size.width, size.height, { fit: size.fit, withoutEnlargement: true })
                .toBuffer({ resolveWithObject: true });

            const suffix = size.name === 'thumbnail' ? '_thumb' : `_${size.name}`;
            const baseName = original.public_id.replace(/\.[^.]+$/, '');
            const sizedKey = `${baseName}${suffix}.${ext}`;

            const url = await this.storage.put(sizedKey, resized.data, contentType);

            image.image[size.name] = {
                public_id: sizedKey,
                version: 1,
                signature: '',
                width: resized.info.width,
                height: resized.info.height,
                format: ext,
                resource_type: 'image',
                url,
                secure_url: url,
                original_filename: `${suffix}.${ext}`,
            };
        }

        // Compress original in-place
        const compressed = await sharp(buffer)
            .rotate()
            .resize(1920, 1920, { fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality: 80, mozjpeg: true })
            .toBuffer({ resolveWithObject: true });

        const originalUrl = await this.storage.put(original.public_id, compressed.data, 'image/jpeg');

        image.image.original = {
            ...original,
            width: compressed.info.width,
            height: compressed.info.height,
            url: originalUrl,
            secure_url: originalUrl,
        };
    }

    private processCloudinary(image: Image, original: IImageEntry, sizes: ResizeSizeConfig[]): void {
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
