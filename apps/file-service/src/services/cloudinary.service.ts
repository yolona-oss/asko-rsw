import { Injectable } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { Readable } from 'stream';
import { StorageProvider } from 'storage/storage-provider.interface';

export interface CloudinaryUploadResult {
    public_id: string;
    version: number;
    signature: string;
    width: number;
    height: number;
    format: string;
    resource_type: string;
    url: string;
    secure_url: string;
    original_filename: string;
}

export interface ImageSizes {
    original: CloudinaryUploadResult;
    thumbnail?: CloudinaryUploadResult;
    medium?: CloudinaryUploadResult;
    large?: CloudinaryUploadResult;
}

@Injectable()
export class CloudinaryService implements StorageProvider {
    constructor() {}

    private readonly config: { app_name: string } = { app_name: 'web-app-fbv' };

    async uploadImage(
        file: Express.Multer.File,
        folder: string = "default",
    ): Promise<CloudinaryUploadResult> {
        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: `${this.config.app_name}/${folder}`,
                    resource_type: 'image',
                    transformation: [
                        { quality: 'auto', fetch_format: 'auto' }
                    ],
                },
                (error, result) => {
                    if (error) reject(error);
                        else resolve(result as CloudinaryUploadResult);
                },
            );

            Readable.from(file.buffer).pipe(uploadStream);
        });
    }

    uploadStream(stream: NodeJS.ReadableStream, mimeType: string): Promise<UploadApiResponse | undefined> {
        return new Promise((resolve, reject) => {
            const upload = cloudinary.uploader.upload_stream(
                {
                    resource_type: "image",
                    format: mimeType === "image/webp" ? "webp" : undefined,
                },
                (err, result) => (err ? reject(err) : resolve(result)),
            );

            stream.pipe(upload);
        });
    }

    async uploadImageBuffer(
        buffer: Buffer,
        filename: string,
        folder: string = "default",
    ): Promise<CloudinaryUploadResult> {
        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: `${this.config.app_name}/${folder}`,
                    public_id: filename,
                    resource_type: 'image',
                },
                (error, result) => {
                    if (error) reject(error);
                        else resolve(result as CloudinaryUploadResult);
                },
            );

            Readable.from(buffer).pipe(uploadStream);
        });
    }

    async uploadImageFromUrl(
        imageUrl: string,
        folder: string,
        filename: string,
    ): Promise<CloudinaryUploadResult> {
        const response = await fetch(imageUrl);
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        return this.uploadImageBuffer(buffer, folder, filename);
    }

    async deleteImage(publicId: string): Promise<void> {
        await cloudinary.uploader.destroy(publicId);
    }

    async deleteImages(publicIds: string[]): Promise<void> {
        await cloudinary.api.delete_resources(publicIds);
    }

    async generateThumbnail(originalUrl: string, width: number, height: number): Promise<string> {
        const publicId = this.extractPublicIdFromUrl(originalUrl);

        return cloudinary.url(publicId, {
            width,
            height,
            crop: 'fill',
            quality: 'auto',
            fetch_format: 'auto',
        });
    }

    async generateMultipleSizes(originalUrl: string): Promise<{
        thumbnail: string;
        medium: string;
        large: string;
    }> {
        const publicId = this.extractPublicIdFromUrl(originalUrl);

        return {
            thumbnail: cloudinary.url(publicId, {
                width: 150,
                height: 150,
                crop: 'fill',
                quality: 'auto',
                fetch_format: 'auto',
            }),
            medium: cloudinary.url(publicId, {
                width: 400,
                height: 300,
                crop: 'limit',
                quality: 'auto',
                fetch_format: 'auto',
            }),
            large: cloudinary.url(publicId, {
                width: 800,
                height: 600,
                crop: 'limit',
                quality: 'auto',
                fetch_format: 'auto',
            }),
        };
    }

    private extractPublicIdFromUrl(url: string): string {
        const matches = url.match(/\/upload\/(?:v\d+\/)?([^\.]+)/);
        return matches ? matches[1] : '';
    }
}
