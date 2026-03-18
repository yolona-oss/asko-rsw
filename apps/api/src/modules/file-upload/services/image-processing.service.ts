import { Inject, Injectable } from '@nestjs/common';
import { ImageSizes } from './cloudinary.service';
import { STORAGE_PROVIDER, StorageProvider } from '../storage/storage-provider.interface';

@Injectable()
export class ImageProcessingService {
    constructor(@Inject(STORAGE_PROVIDER) private readonly storage: StorageProvider) {}

    async processUserAvatar(file: Express.Multer.File): Promise<ImageSizes> {
        const original = await this.storage.uploadImage(file, 'avatars');

        const thumbnailUrl = await this.storage.generateThumbnail(
            original.secure_url,
            150,
            150,
        );

        return {
            original,
            thumbnail: {
                ...original,
                secure_url: thumbnailUrl,
                url: thumbnailUrl,
                width: 150,
                height: 150,
            },
        };
    }

    async processProductImage(file: Express.Multer.File): Promise<ImageSizes> {
        const original = await this.storage.uploadImage(file, 'products');

        const sizes = await this.storage.generateMultipleSizes(original.secure_url);

        return {
            original,
            thumbnail: {
                ...original,
                secure_url: sizes.thumbnail,
                url: sizes.thumbnail,
                width: 150,
                height: 150,
            },
            medium: {
                ...original,
                secure_url: sizes.medium,
                url: sizes.medium,
                width: 400,
                height: 300,
            },
            large: {
                ...original,
                secure_url: sizes.large,
                url: sizes.large,
                width: 800,
                height: 600,
            },
        };
    }

    async deleteImageFiles(imageSizes: ImageSizes): Promise<void> {
        const publicIds = Object.values(imageSizes)
        .filter(Boolean)
        .map(image => image.public_id);

        if (publicIds.length > 0) {
            await this.storage.deleteImages(publicIds);
        }
    }
}
