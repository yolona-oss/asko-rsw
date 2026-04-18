import { Injectable, Logger } from '@nestjs/common';
import { AppConfig } from 'app.config';
import { safePath } from 'common/safe-path';
import * as path from 'path';
import * as fs from 'fs/promises';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

export interface VideoCompressResult {
    size: number;
    duration?: number;
    newPublicId?: string;
}

export interface VideoCompressPathResult {
    outputPath: string;
    size: number;
    duration?: number;
}

@Injectable()
export class VideoCompressService {
    private readonly logger = new Logger(VideoCompressService.name);

    constructor(private readonly config: AppConfig) {}

    private get staticPath(): string {
        return this.config.staticPath;
    }

    /** Compress a video stored on the local filesystem (by publicId). */
    async compress(publicId: string): Promise<VideoCompressResult> {
        const inputPath = safePath(this.staticPath, 'videos', publicId);
        const parsed = path.parse(inputPath);
        const tempPath = safePath(parsed.dir, `${parsed.name}_compressing.mp4`);

        await this.runFfmpeg(inputPath, tempPath);

        const stat = await fs.stat(tempPath);
        const duration = await this.probeDuration(tempPath);

        const formatChanged = parsed.ext.toLowerCase() !== '.mp4';
        let newPublicId: string | undefined;

        if (formatChanged) {
            await fs.unlink(inputPath).catch(() => {});
            const newName = `${parsed.name}.mp4`;
            newPublicId = publicId.replace(`${parsed.name}${parsed.ext}`, newName);
        }

        const finalPath = formatChanged
            ? safePath(parsed.dir, `${parsed.name}.mp4`)
            : inputPath;
        await fs.rename(tempPath, finalPath);

        this.logger.log(`Compressed ${publicId}: ${stat.size} bytes`);
        return { size: stat.size, duration, newPublicId };
    }

    /** Compress a video at an arbitrary filesystem path (for S3 temp files). */
    async compressPath(inputPath: string): Promise<VideoCompressPathResult> {
        const parsed = path.parse(inputPath);
        const outputPath = safePath(parsed.dir, `${parsed.name}_compressed.mp4`);

        await this.runFfmpeg(inputPath, outputPath);

        const stat = await fs.stat(outputPath);
        const duration = await this.probeDuration(outputPath);

        this.logger.log(`Compressed ${inputPath}: ${stat.size} bytes`);
        return { outputPath, size: stat.size, duration };
    }

    private runFfmpeg(inputPath: string, outputPath: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            ffmpeg(inputPath)
                .videoCodec('libx264')
                .audioCodec('aac')
                .audioBitrate('128k')
                .outputOptions([
                    '-crf 28',
                    '-preset medium',
                    '-movflags +faststart',
                    '-vf', 'scale=trunc(iw/2)*2:min(720\\,ih)',
                ])
                .output(outputPath)
                .on('end', () => resolve())
                .on('error', (err) => reject(err))
                .run();
        });
    }

    private probeDuration(filePath: string): Promise<number | undefined> {
        return new Promise((resolve) => {
            ffmpeg.ffprobe(filePath, (err, metadata) => {
                if (err || !metadata?.format?.duration) {
                    resolve(undefined);
                } else {
                    resolve(metadata.format.duration);
                }
            });
        });
    }
}
