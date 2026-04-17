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

@Injectable()
export class VideoCompressService {
    private readonly logger = new Logger(VideoCompressService.name);

    constructor(private readonly config: AppConfig) {}

    private get staticPath(): string {
        return this.config.staticPath;
    }

    async compress(publicId: string): Promise<VideoCompressResult> {
        const inputPath = safePath(this.staticPath, 'videos', publicId);
        const parsed = path.parse(inputPath);
        const tempPath = safePath(parsed.dir, `${parsed.name}_compressing.mp4`);

        await new Promise<void>((resolve, reject) => {
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
                .output(tempPath)
                .on('end', () => resolve())
                .on('error', (err) => reject(err))
                .run();
        });

        const stat = await fs.stat(tempPath);
        const duration = await this.probeDuration(tempPath);

        const formatChanged = parsed.ext.toLowerCase() !== '.mp4';
        let newPublicId: string | undefined;

        if (formatChanged) {
            // Original was not .mp4 — remove old file, update public_id
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
