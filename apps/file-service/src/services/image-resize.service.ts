import { Injectable } from '@nestjs/common';
import { AppConfig } from 'app.config';
import { CloudinaryUploadResult } from './cloudinary.service';
import sharp from 'sharp';
import * as path from 'path';
import * as fs from 'fs/promises';

interface ResizedImages {
    thumbnail: CloudinaryUploadResult;
    medium: CloudinaryUploadResult;
    large: CloudinaryUploadResult;
}

@Injectable()
export class ImageResizeService {
    constructor(private readonly config: AppConfig) {}

    private get staticPath(): string {
        return this.config.staticPath;
    }

    private get serverUrl(): string {
        return this.config.serverUrl;
    }

    async generateSizes(originalPublicId: string): Promise<ResizedImages> {
        const inputPath = path.join(this.staticPath, originalPublicId);
        const parsed = path.parse(inputPath);
        const folder = path.dirname(originalPublicId);

        const sizes = [
            { suffix: '_thumb', width: 150, height: 150, fit: 'cover' as const },
            { suffix: '_medium', width: 400, height: 300, fit: 'inside' as const },
            { suffix: '_large', width: 800, height: 600, fit: 'inside' as const },
        ];

        const results: CloudinaryUploadResult[] = [];

        for (const size of sizes) {
            const outputName = `${parsed.name}${size.suffix}${parsed.ext}`;
            const outputPath = path.join(parsed.dir, outputName);
            const relativePath = `${folder}/${outputName}`;

            await sharp(inputPath)
                .resize(size.width, size.height, { fit: size.fit, withoutEnlargement: true })
                .toFile(outputPath);

            const meta = await sharp(outputPath).metadata();

            results.push({
                public_id: relativePath,
                version: 1,
                signature: '',
                width: meta.width ?? size.width,
                height: meta.height ?? size.height,
                format: parsed.ext.replace('.', ''),
                resource_type: 'image',
                url: `${this.serverUrl}/images/${relativePath}`,
                secure_url: `${this.serverUrl}/images/${relativePath}`,
                original_filename: outputName,
            });
        }

        return {
            thumbnail: results[0],
            medium: results[1],
            large: results[2],
        };
    }

    async deleteResizedFiles(originalPublicId: string): Promise<void> {
        const inputPath = path.join(this.staticPath, originalPublicId);
        const parsed = path.parse(inputPath);

        for (const suffix of ['_thumb', '_medium', '_large']) {
            const filePath = path.join(parsed.dir, `${parsed.name}${suffix}${parsed.ext}`);
            await fs.unlink(filePath).catch(() => {});
        }
    }
}
