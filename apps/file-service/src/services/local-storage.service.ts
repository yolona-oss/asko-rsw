import { Injectable } from '@nestjs/common';
import { AppConfig } from 'app.config';
import { CloudinaryUploadResult } from './cloudinary.service';
import { StorageProvider, StreamUploadMeta, VideoUploadResult } from 'storage/storage-provider.interface';
import { safePath } from 'common/safe-path';
import { v4 as uuid } from 'uuid';
import * as fs from 'fs/promises';
import { createWriteStream } from 'fs';
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

    private extFromMime(mimeType: string): string {
        const map: Record<string, string> = {
            'image/jpeg': 'jpg',
            'image/png': 'png',
            'image/webp': 'webp',
            'image/gif': 'gif',
        };
        return map[mimeType] ?? 'jpg';
    }

    private videoExtFromMime(mimeType: string): string {
        const map: Record<string, string> = {
            'video/mp4': 'mp4',
            'video/webm': 'webm',
            'video/quicktime': 'mov',
        };
        return map[mimeType] ?? 'mp4';
    }

    private buildResult(relativePath: string, filename: string, format: string): CloudinaryUploadResult {
        const fileUrl = `${this.publicUrl}/images/${relativePath}`;
        return {
            public_id: relativePath,
            version: 1,
            signature: '',
            width: 0,
            height: 0,
            format,
            resource_type: 'image',
            url: fileUrl,
            secure_url: fileUrl,
            original_filename: filename,
        };
    }

    private buildVideoResult(relativePath: string, filename: string, format: string, size?: number): VideoUploadResult {
        const fileUrl = `${this.publicUrl}/videos/${relativePath}`;
        return {
            public_id: relativePath,
            format,
            resource_type: 'video',
            url: fileUrl,
            secure_url: fileUrl,
            original_filename: filename,
            size,
        };
    }

    async uploadImageStream(stream: NodeJS.ReadableStream, meta: StreamUploadMeta, folder: string = 'default'): Promise<CloudinaryUploadResult> {
        const ext = this.extFromMime(meta.mimetype);
        const filename = `${uuid()}.${ext}`;
        const dir = safePath(this.staticPath, folder);
        await this.ensureDir(dir);
        await pipeline(stream, createWriteStream(safePath(dir, filename)));
        return this.buildResult(`${folder}/${filename}`, meta.originalname, ext);
    }

    async uploadVideoStream(stream: NodeJS.ReadableStream, meta: StreamUploadMeta, folder: string = 'default'): Promise<VideoUploadResult> {
        const ext = this.videoExtFromMime(meta.mimetype);
        const filename = `${uuid()}.${ext}`;
        const dir = safePath(this.staticPath, 'videos', folder);
        await this.ensureDir(dir);
        const filePath = safePath(dir, filename);
        await pipeline(stream, createWriteStream(filePath));
        const stat = await fs.stat(filePath).catch(() => undefined);
        return this.buildVideoResult(`${folder}/${filename}`, meta.originalname, ext, stat?.size);
    }

    async deleteImage(id: string): Promise<void> {
        const filePath = safePath(this.staticPath, id);
        await fs.unlink(filePath).catch(() => {});
    }

    async deleteImages(ids: string[]): Promise<void> {
        await Promise.all(ids.map(id => this.deleteImage(id)));
    }

    async deleteVideo(id: string): Promise<void> {
        const filePath = safePath(this.staticPath, 'videos', id);
        await fs.unlink(filePath).catch(() => {});
    }

    generateSizedUrl(url: string): string {
        return url;
    }
}
