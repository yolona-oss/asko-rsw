import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { grpcCall, grpcStreamUpload, type StreamUploadOptions } from '@asko/gateway-common';
import { ImageTypeEnum } from '@asko/shared';
import type { Readable } from 'node:stream';

import type {
    FileServiceClient,
    ImageRecord,
    ImageResponse,
    ImageListResponse,
    EmptyFileResponse,
    VideoRecord,
    VideoResponse,
} from '@asko/proto';

/**
 * Minimal file client for content-gateway — exposes operations needed by
 * the articles controller and article file uploads (image listing,
 * reordering, removal, article image/video upload).
 */
@Injectable()
export class FileClientService implements OnModuleInit {
    private fileService!: FileServiceClient;

    constructor(
        @Inject('FILE_PACKAGE') private readonly client: ClientGrpc,
    ) {}

    onModuleInit() {
        this.fileService = this.client.getService<FileServiceClient>('FileService');
    }

    private parseRecord(record: ImageRecord): ImageRecord & { imageJson: any } {
        try {
            return { ...record, imageJson: JSON.parse(record.imageJson) };
        } catch {
            return record as any;
        }
    }

    private parseImageResponse(res: ImageResponse) {
        return { image: this.parseRecord(res.image) };
    }

    private parseImageListResponse(res: ImageListResponse) {
        return { images: (res.images ?? []).map((r) => this.parseRecord(r)) };
    }

    private parseVideoRecord(record: VideoRecord): VideoRecord & { videoJson: any } {
        try {
            return { ...record, videoJson: JSON.parse(record.videoJson) };
        } catch {
            return record as any;
        }
    }

    private parseVideoResponse(res: VideoResponse) {
        return { video: this.parseVideoRecord(res.video) };
    }

    async findAttachedImages(ownerType: ImageTypeEnum, ownerId: string) {
        const res = await grpcCall(this.fileService.findAttachedImages({ ownerType, ownerId }));
        return this.parseImageListResponse(res);
    }

    remove(id: string): Promise<EmptyFileResponse> {
        return grpcCall(this.fileService.remove({ id }));
    }

    async reorderByIds(ownerType: ImageTypeEnum, ownerId: string, imageIds: string[]) {
        const res = await grpcCall(this.fileService.reorderByIds({ ownerType, ownerId, imageIds }));
        return this.parseImageListResponse(res);
    }

    async uploadArticleImage(
        stream: Readable, originalname: string, mimetype: string, ownerId: string, opts: StreamUploadOptions,
    ) {
        const res = await grpcStreamUpload(
            (c$) => this.fileService.uploadArticleImage(c$),
            stream, { originalname, mimetype, ownerId }, opts,
        );
        return this.parseImageResponse(res);
    }

    async uploadArticleVideo(
        stream: Readable, originalname: string, mimetype: string, ownerId: string, opts: StreamUploadOptions,
    ) {
        const res = await grpcStreamUpload(
            (c$) => this.fileService.uploadArticleVideo(c$),
            stream, { originalname, mimetype, ownerId }, opts,
        );
        return this.parseVideoResponse(res);
    }
}
