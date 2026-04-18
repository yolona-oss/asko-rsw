import { Injectable } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { PassThrough } from 'stream';
import { slugify } from '@asko/shared';
import {
    StorageProvider,
    ResourceType,
    StorageUploadMeta,
    StorageUploadResult,
} from 'storage/storage-provider.interface';

@Injectable()
export class CloudinaryService implements StorageProvider {
    private readonly config: { app_name: string } = { app_name: 'web-app-fbv' };

    async upload(
        stream: NodeJS.ReadableStream,
        meta: StorageUploadMeta,
        resourceType: ResourceType,
        folder: string,
    ): Promise<StorageUploadResult> {
        const opts: Record<string, unknown> = {
            folder: resourceType === 'raw'
                ? `${this.config.app_name}/documents/${folder}`
                : `${this.config.app_name}/${folder}`,
            resource_type: resourceType,
        };

        if (resourceType === 'image') {
            opts.transformation = [{ quality: 'auto', fetch_format: 'auto' }];
        }

        if (resourceType === 'raw') {
            opts.public_id = `${uuid()}_${slugify(meta.originalname)}`;
            opts.use_filename = false;
            opts.unique_filename = true;
        }

        return new Promise((resolve, reject) => {
            let bytes = 0;
            const upload = cloudinary.uploader.upload_stream(opts, (err, result) => {
                if (err || !result) return reject(err ?? new Error('Cloudinary returned no result'));
                const r = result as UploadApiResponse;
                resolve({
                    publicId: r.public_id,
                    url: r.url,
                    secureUrl: r.secure_url ?? r.url,
                    originalFilename: r.original_filename ?? meta.originalname,
                    format: r.format ?? '',
                    resourceType: r.resource_type ?? resourceType,
                    width: r.width,
                    height: r.height,
                    version: r.version,
                    signature: r.signature,
                    duration: r.duration,
                    size: r.bytes ?? bytes,
                });
            });

            if (resourceType === 'raw') {
                const counter = new PassThrough();
                counter.on('data', (chunk: Buffer) => { bytes += chunk.length; });
                stream.pipe(counter).pipe(upload);
            } else {
                stream.pipe(upload);
            }
        });
    }

    async delete(publicId: string, resourceType: ResourceType): Promise<void> {
        await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    }

    async deleteBatch(publicIds: string[], resourceType: ResourceType): Promise<void> {
        if (publicIds.length === 0) return;
        await cloudinary.api.delete_resources(publicIds, { resource_type: resourceType });
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

    async put(_key: string, _data: Buffer, _contentType: string): Promise<string> {
        throw new Error('CloudinaryService.put() is not supported — Cloudinary mode uses URL transformations');
    }

    async download(_publicId: string, _resourceType: ResourceType): Promise<NodeJS.ReadableStream> {
        throw new Error('CloudinaryService.download() is not supported — Cloudinary mode uses URL transformations');
    }

    private extractPublicIdFromUrl(url: string): string {
        const matches = url.match(/\/upload\/(?:v\d+\/)?([^.]+)/);
        return matches ? matches[1] : '';
    }
}
