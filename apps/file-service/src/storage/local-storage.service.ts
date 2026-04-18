import { Injectable } from '@nestjs/common';
import { AppConfig } from 'app.config';
import {
    StorageProvider,
    ResourceType,
    StorageUploadMeta,
    StorageUploadResult,
} from 'storage/storage-provider.interface';
import { safePath } from 'common/safe-path';
import { extFromMime } from 'upload/mime-utils';
import { v4 as uuid } from 'uuid';
import * as fs from 'fs/promises';
import { createReadStream, createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';

@Injectable()
export class LocalStorageService implements StorageProvider {
    constructor(private readonly config: AppConfig) {}

    private get staticPath(): string {
        return this.config.staticPath;
    }

    private get publicUrl(): string {
        return this.config.publicUrl;
    }

    private async ensureDir(dir: string): Promise<void> {
        await fs.mkdir(dir, { recursive: true });
    }

    private resolvePaths(resourceType: ResourceType, folder: string) {
        switch (resourceType) {
            case 'image':
                return { dir: safePath(this.staticPath, folder), urlPrefix: `/images/${folder}` };
            case 'video':
                return { dir: safePath(this.staticPath, 'videos', folder), urlPrefix: `/videos/${folder}` };
            case 'raw':
                return { dir: safePath(this.staticPath, 'documents', folder), urlPrefix: `/documents/${folder}` };
        }
    }

    async upload(
        stream: NodeJS.ReadableStream,
        meta: StorageUploadMeta,
        resourceType: ResourceType,
        folder: string,
    ): Promise<StorageUploadResult> {
        const ext = extFromMime(meta.mimetype, meta.originalname);
        const filename = `${uuid()}.${ext}`;
        const { dir, urlPrefix } = this.resolvePaths(resourceType, folder);

        await this.ensureDir(dir);
        const filePath = safePath(dir, filename);
        await pipeline(stream, createWriteStream(filePath));

        const stat = await fs.stat(filePath);
        const fileUrl = `${this.publicUrl}${urlPrefix}/${filename}`;
        const publicId = resourceType === 'raw'
            ? `documents/${folder}/${filename}`
            : `${folder}/${filename}`;

        return {
            publicId,
            url: fileUrl,
            secureUrl: fileUrl,
            originalFilename: meta.originalname,
            format: ext,
            resourceType,
            width: 0,
            height: 0,
            version: 1,
            signature: '',
            size: stat.size,
        };
    }

    async delete(publicId: string, resourceType: ResourceType): Promise<void> {
        const filePath = resourceType === 'video'
            ? safePath(this.staticPath, 'videos', publicId)
            : safePath(this.staticPath, publicId);
        await fs.unlink(filePath).catch(() => {});
    }

    async deleteBatch(publicIds: string[], resourceType: ResourceType): Promise<void> {
        await Promise.all(publicIds.map(id => this.delete(id, resourceType)));
    }

    async put(key: string, data: Buffer, _contentType: string): Promise<string> {
        const filePath = safePath(this.staticPath, key);
        const { dirname } = await import('path');
        await this.ensureDir(dirname(filePath));
        await fs.writeFile(filePath, data);
        return `${this.publicUrl}/images/${key}`;
    }

    generateSizedUrl(url: string): string {
        return url;
    }

    async download(publicId: string, resourceType: ResourceType): Promise<NodeJS.ReadableStream> {
        const filePath = resourceType === 'video'
            ? safePath(this.staticPath, 'videos', publicId)
            : safePath(this.staticPath, publicId);
        return createReadStream(filePath);
    }
}
