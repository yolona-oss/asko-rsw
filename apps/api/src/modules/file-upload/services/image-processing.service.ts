import { Injectable } from '@nestjs/common';
import { CloudinaryService, ImageSizes } from './cloudinary.service';
// import * as sharp from 'sharp';

@Injectable()
export class ImageProcessingService {
    constructor(private readonly cloudinaryService: CloudinaryService) {}

    async processUserAvatar(file: Express.Multer.File): Promise<ImageSizes> {
        // Upload original image
        const original = await this.cloudinaryService.uploadImage(file, 'avatars');

        // Create thumbnail using Cloudinary transformations
        const thumbnailUrl = await this.cloudinaryService.generateThumbnail(
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
        // Upload original image
        const original = await this.cloudinaryService.uploadImage(file, 'products');

        // Generate multiple sizes using Cloudinary
        const sizes = await this.cloudinaryService.generateMultipleSizes(original.secure_url);

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
            await this.cloudinaryService.deleteImages(publicIds);
        }
    }
}
