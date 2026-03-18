import { Injectable } from '@nestjs/common';
import { AppConfig } from 'app.config';
import { CloudinaryUploadResult } from './cloudinary.service';
import { StorageProvider } from '../storage/storage-provider.interface';
import { v4 as uuid } from 'uuid';
import * as fs from 'fs/promises';
import * as path from 'path';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';

@Injectable()
export class LocalStorageService implements StorageProvider {
    constructor(private readonly config: AppConfig) {}

    private get staticPath(): string {
        return this.config.staticPath;
    }

    private get serverUrl(): string {
        return this.config.serverUrl;
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

    private buildResult(relativePath: string, filename: string, format: string): CloudinaryUploadResult {
        const fileUrl = `${this.serverUrl}/images/${relativePath}`;
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

    async uploadImage(file: Express.Multer.File, folder: string = 'default'): Promise<CloudinaryUploadResult> {
        const ext = this.extFromMime(file.mimetype);
        const filename = `${uuid()}.${ext}`;
        const dir = path.join(this.staticPath, folder);
        await this.ensureDir(dir);
        await fs.writeFile(path.join(dir, filename), file.buffer);
        return this.buildResult(`${folder}/${filename}`, file.originalname, ext);
    }

    async uploadImageBuffer(buffer: Buffer, filename: string, folder: string = 'default'): Promise<CloudinaryUploadResult> {
        const ext = path.extname(filename).replace('.', '') || 'jpg';
        const storedName = `${uuid()}.${ext}`;
        const dir = path.join(this.staticPath, folder);
        await this.ensureDir(dir);
        await fs.writeFile(path.join(dir, storedName), buffer);
        return this.buildResult(`${folder}/${storedName}`, filename, ext);
    }

    async uploadStream(stream: NodeJS.ReadableStream, mimeType: string): Promise<CloudinaryUploadResult | undefined> {
        const ext = this.extFromMime(mimeType);
        const filename = `${uuid()}.${ext}`;
        const dir = path.join(this.staticPath, 'uploads');
        await this.ensureDir(dir);
        const filePath = path.join(dir, filename);
        await pipeline(stream, createWriteStream(filePath));
        return this.buildResult(`uploads/${filename}`, filename, ext);
    }

    async deleteImage(id: string): Promise<void> {
        const filePath = path.join(this.staticPath, id);
        await fs.unlink(filePath).catch(() => {});
    }

    async deleteImages(ids: string[]): Promise<void> {
        await Promise.all(ids.map(id => this.deleteImage(id)));
    }

    async generateThumbnail(url: string, _width: number, _height: number): Promise<string> {
        return url;
    }

    async generateMultipleSizes(url: string): Promise<{ thumbnail: string; medium: string; large: string }> {
        return { thumbnail: url, medium: url, large: url };
    }
}
