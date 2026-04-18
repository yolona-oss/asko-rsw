import { CreateRequestContext, EntityManager } from '@mikro-orm/postgresql';
import { Inject, Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { FileStorageMode, IImageEntry, ImageTypeEnum, VideoTypeEnum } from '@asko/shared';

import { Image } from 'image/image.entity';
import { Video } from 'video/video.entity';
import { Document } from 'document/document.entity';
import { ImageObj } from 'image/image.obj';

import { AppConfig } from 'app.config';
import { AppErrors } from 'common/error';
import { isAllowedDocumentMime } from 'upload/mime-utils';
import { resolveUploadRoute } from 'upload/upload-routing';
import { collectPublicIds } from 'image/image-utils';
import { AccessParams, persistFileAccess } from 'common/file-access.helper';
import { STORAGE_PROVIDER, StorageProvider, StorageUploadResult } from 'storage/storage-provider.interface';
import { IMAGE_RESIZE_QUEUE } from 'image/image.module';
import { VIDEO_COMPRESS_QUEUE } from 'video/video.module';
import type { ImageResizeJobData } from 'image/image-resize.processor';
import type { VideoCompressJobData } from 'video/video-compress.processor';
import type { VideoMetadata } from 'video/video-metadata.obj';

const JOB_OPTS = {
    attempts: 3,
    backoff: { type: 'exponential' as const, delay: 5000 },
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 5000 },
};

export type UploadFileResult =
    | { fileType: 'image'; image: Image }
    | { fileType: 'video'; video: Video }
    | { fileType: 'document'; document: Document };

@Injectable()
export class UploadService {
    constructor(
        private readonly em: EntityManager,
        @Inject(STORAGE_PROVIDER) private readonly storage: StorageProvider,
        @InjectQueue(IMAGE_RESIZE_QUEUE) private readonly resizeQueue: Queue<ImageResizeJobData>,
        @InjectQueue(VIDEO_COMPRESS_QUEUE) private readonly compressQueue: Queue<VideoCompressJobData>,
        private readonly config: AppConfig,
    ) {}

    @CreateRequestContext()
    async uploadFile(
        stream: NodeJS.ReadableStream,
        meta: { originalname: string; mimetype: string; alt?: string },
        ownerType?: string,
        ownerId?: string,
        replaceExisting?: boolean,
        access?: AccessParams,
    ): Promise<UploadFileResult> {
        const route = resolveUploadRoute(meta.mimetype, ownerType, replaceExisting);

        if (route.mediaKind === 'document' && !isAllowedDocumentMime(meta.mimetype)) {
            throw AppErrors.badRequest(`Unsupported document mime type: ${meta.mimetype}`);
        }

        if (route.replaceExisting && ownerId) {
            await this.deleteExisting(route.mediaKind, ownerType!, ownerId);
        }

        const result = await this.storage.upload(stream, meta, route.resourceType, route.folder);

        switch (route.mediaKind) {
            case 'image':
                return { fileType: 'image', image: await this.createImage(result, meta.alt, route, ownerId, access) };
            case 'video':
                return { fileType: 'video', video: await this.createVideo(result, route, ownerId, access) };
            case 'document':
                return { fileType: 'document', document: await this.createDocument(result, meta, route, ownerId, access) };
        }
    }

    private async createImage(
        result: StorageUploadResult,
        alt: string | undefined,
        route: ReturnType<typeof resolveUploadRoute>,
        ownerId?: string,
        access?: AccessParams,
    ): Promise<Image> {
        const entry: IImageEntry = {
            public_id: result.publicId,
            version: result.version ?? 1,
            signature: result.signature ?? '',
            width: result.width ?? 0,
            height: result.height ?? 0,
            format: result.format,
            resource_type: 'image',
            url: result.url,
            secure_url: result.secureUrl,
            original_filename: result.originalFilename,
        };

        const image = new Image();
        image.image = { original: entry } as ImageObj;
        image.alt = alt;

        if (route.imageTypeEnum && ownerId) {
            image.ownerType = route.imageTypeEnum;
            image.ownerId = String(ownerId);
            image.order = await this.em.count(Image, { ownerId: image.ownerId, ownerType: image.ownerType });
        }

        await this.em.persistAndFlush(image);
        await this.resizeQueue.add('resize', { imageId: image.id }, JOB_OPTS);
        await persistFileAccess(this.em, image.id, 'image', access);
        return image;
    }

    private async createVideo(
        result: StorageUploadResult,
        route: ReturnType<typeof resolveUploadRoute>,
        ownerId?: string,
        access?: AccessParams,
    ): Promise<Video> {
        const videoMeta: VideoMetadata = {
            public_id: result.publicId,
            format: result.format,
            resource_type: 'video',
            url: result.url,
            secure_url: result.secureUrl,
            original_filename: result.originalFilename,
            duration: result.duration,
            size: result.size,
        };

        const video = new Video();
        video.video = videoMeta;

        if (route.videoTypeEnum && ownerId) {
            video.ownerType = route.videoTypeEnum;
            video.ownerId = String(ownerId);
            video.order = await this.em.count(Video, { ownerId: video.ownerId, ownerType: video.ownerType });
        }

        await this.em.persistAndFlush(video);

        if (this.config.fileStorageMode !== FileStorageMode.CLOUDINARY) {
            await this.compressQueue.add('compress', { videoId: video.id }, JOB_OPTS);
        }

        await persistFileAccess(this.em, video.id, 'video', access);
        return video;
    }

    private async createDocument(
        result: StorageUploadResult,
        meta: { originalname: string; mimetype: string },
        route: ReturnType<typeof resolveUploadRoute>,
        ownerId?: string,
        access?: AccessParams,
    ): Promise<Document> {
        const doc = new Document();
        doc.ownerType = route.folder;
        doc.ownerId = String(ownerId ?? '');
        doc.storageUrl = result.secureUrl;
        doc.publicId = result.publicId;
        doc.mimeType = meta.mimetype;
        doc.filename = meta.originalname;
        doc.sizeBytes = result.size ?? 0;

        await this.em.persistAndFlush(doc);
        await persistFileAccess(this.em, doc.id, 'document', access);
        return doc;
    }

    private async deleteExisting(mediaKind: string, ownerType: string, ownerId: string): Promise<void> {
        const id = String(ownerId);
        if (mediaKind === 'image') {
            const images = await this.em.find(Image, { ownerType: ownerType as ImageTypeEnum, ownerId: id });
            const allIds = images.flatMap(collectPublicIds);
            if (allIds.length > 0) await this.storage.deleteBatch(allIds, 'image');
            images.forEach(img => this.em.remove(img));
            if (images.length > 0) await this.em.flush();
        } else if (mediaKind === 'video') {
            const videos = await this.em.find(Video, { ownerType: ownerType as VideoTypeEnum, ownerId: id });
            const allIds = videos.map(v => v.video.public_id).filter(Boolean);
            if (allIds.length > 0) await this.storage.deleteBatch(allIds, 'video');
            videos.forEach(v => this.em.remove(v));
            if (videos.length > 0) await this.em.flush();
        } else {
            const docs = await this.em.find(Document, { ownerType, ownerId: id });
            const allIds = docs.map(d => d.publicId).filter((id): id is string => !!id);
            if (allIds.length > 0) await this.storage.deleteBatch(allIds, 'raw');
            docs.forEach(d => this.em.remove(d));
            if (docs.length > 0) await this.em.flush();
        }
    }
}
