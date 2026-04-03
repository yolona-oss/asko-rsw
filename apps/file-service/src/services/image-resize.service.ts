import { Injectable } from '@nestjs/common';
import { AppConfig } from 'app.config';
import { CloudinaryUploadResult } from './cloudinary.service';
import type { ResizeSizeConfig } from 'common/resize-config';
import sharp from 'sharp';
import * as path from 'path';
import * as fs from 'fs/promises';

const SUFFIX_MAP: Record<string, string> = {
    thumbnail: '_thumb',
    medium: '_medium',
    large: '_large',
};

@Injectable()
export class ImageResizeService {
    constructor(private readonly config: AppConfig) {}

    private get staticPath(): string {
        return this.config.staticPath;
    }

    private get serverUrl(): string {
        return this.config.serverUrl;
    }

    async generateSizes(
        originalPublicId: string,
        sizes: ResizeSizeConfig[],
    ): Promise<Record<string, CloudinaryUploadResult>> {
        const inputPath = path.join(this.staticPath, originalPublicId);
        const parsed = path.parse(inputPath);
        const folder = path.dirname(originalPublicId);

        const originalMeta = await sharp(inputPath).metadata();
        const origW = originalMeta.width ?? 0;
        const origH = originalMeta.height ?? 0;

        const results: Record<string, CloudinaryUploadResult> = {};

        for (const size of sizes) {
            const suffix = SUFFIX_MAP[size.name] ?? `_${size.name}`;

            // Skip resize if original already matches target
            if (origW === size.width && origH === size.height) {
                const originalUrl = `${this.serverUrl}/images/${originalPublicId}`;
                results[size.name] = {
                    public_id: originalPublicId,
                    version: 1,
                    signature: '',
                    width: origW,
                    height: origH,
                    format: parsed.ext.replace('.', ''),
                    resource_type: 'image',
                    url: originalUrl,
                    secure_url: originalUrl,
                    original_filename: parsed.base,
                };
                continue;
            }

            const outputName = `${parsed.name}${suffix}${parsed.ext}`;
            const outputPath = path.join(parsed.dir, outputName);
            const relativePath = `${folder}/${outputName}`;

            await sharp(inputPath)
                .resize(size.width, size.height, { fit: size.fit, withoutEnlargement: true })
                .toFile(outputPath);

            const meta = await sharp(outputPath).metadata();

            results[size.name] = {
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
            };
        }

        return results;
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
