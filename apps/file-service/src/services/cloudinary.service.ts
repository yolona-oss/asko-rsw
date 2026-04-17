import { Injectable } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { StorageProvider, StreamUploadMeta, VideoUploadResult } from 'storage/storage-provider.interface';

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

@Injectable()
export class CloudinaryService implements StorageProvider {
    private readonly config: { app_name: string } = { app_name: 'web-app-fbv' };

    async uploadImageStream(
        stream: NodeJS.ReadableStream,
        _meta: StreamUploadMeta,
        folder: string = 'default',
    ): Promise<CloudinaryUploadResult> {
        return new Promise((resolve, reject) => {
            const upload = cloudinary.uploader.upload_stream(
                {
                    folder: `${this.config.app_name}/${folder}`,
                    resource_type: 'image',
                    transformation: [{ quality: 'auto', fetch_format: 'auto' }],
                },
                (err, result) => (err ? reject(err) : resolve(result as CloudinaryUploadResult)),
            );
            stream.pipe(upload);
        });
    }

    async uploadVideoStream(
        stream: NodeJS.ReadableStream,
        meta: StreamUploadMeta,
        folder: string = 'default',
    ): Promise<VideoUploadResult> {
        return new Promise((resolve, reject) => {
            const upload = cloudinary.uploader.upload_stream(
                {
                    folder: `${this.config.app_name}/${folder}`,
                    resource_type: 'video',
                },
                (err, result) => {
                    if (err) return reject(err);
                    const r = result as UploadApiResponse;
                    resolve({
                        public_id: r.public_id,
                        format: r.format,
                        resource_type: r.resource_type,
                        url: r.url,
                        secure_url: r.secure_url,
                        original_filename: r.original_filename ?? meta.originalname,
                        duration: r.duration,
                        size: r.bytes,
                    });
                },
            );
            stream.pipe(upload);
        });
    }

    async deleteImage(publicId: string): Promise<void> {
        await cloudinary.uploader.destroy(publicId);
    }

    async deleteImages(publicIds: string[]): Promise<void> {
        await cloudinary.api.delete_resources(publicIds);
    }

    async deleteVideo(publicId: string): Promise<void> {
        await cloudinary.uploader.destroy(publicId, { resource_type: 'video' });
    }

    generateSizedUrl(url: string, width: number, height: number, fit: 'cover' | 'inside'): string {
        const publicId = this.extractPublicIdFromUrl(url);
        return cloudinary.url(publicId, {
            width,
            height,
            crop: fit === 'cover' ? 'fill' : 'limit',
            quality: 'auto',
            fetch_format: 'auto',
        });
    }

    private extractPublicIdFromUrl(url: string): string {
        const matches = url.match(/\/upload\/(?:v\d+\/)?([^.]+)/);
        return matches ? matches[1] : '';
    }
}
