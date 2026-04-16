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
    VideoListResponse,
    FileAccessResponse,
    DocumentRecord,
    DocumentResponse,
    DocumentListResponse,
} from '@asko/proto';

/**
 * File client for media-gateway — exposes only the methods used by the
 * remaining admin endpoints (generic image/video/document upload, attach,
 * unattach, delete, from-url, attached-lists) and the access-controlled
 * file-serving layer. Per-domain uploads (avatar, device, article,
 * repair-request, review, broken-part, etc.) live on their owning gateways.
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

    // Note: buffered helpers retained only for methods that still take multer files
    // (currently none — all uploads are streaming). Left as reference, unused.
    // private toFileData(file: Express.Multer.File) { ... }

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

    // --- Generic image operations ---

    async upload(
        stream: Readable, originalname: string, mimetype: string, opts: StreamUploadOptions, alt?: string,
    ) {
        const res = await grpcStreamUpload(
            (c$) => this.fileService.upload(c$),
            stream,
            { originalname, mimetype, ownerId: '', alt: alt ?? '' },
            opts,
        );
        return this.parseImageResponse(res);
    }

    async createFromUrl(url: string, ownerType?: ImageTypeEnum, ownerId?: string, order?: number) {
        const res = await grpcCall(this.fileService.createFromUrl({
            url,
            ownerType: ownerType ?? '',
            ownerId: ownerId ?? '',
            order: order ?? 0,
        }));
        return this.parseImageResponse(res);
    }

    remove(id: string): Promise<EmptyFileResponse> {
        return grpcCall(this.fileService.remove({ id }));
    }

    unattachImage(imageId: string): Promise<EmptyFileResponse> {
        return grpcCall(this.fileService.unattachImage({ id: imageId }));
    }

    async attachImage(imageId: string, dto: { ownerType: ImageTypeEnum; ownerId: string }) {
        const res = await grpcCall(this.fileService.attachImage({
            imageId,
            ownerType: dto.ownerType,
            ownerId: dto.ownerId,
        }));
        return this.parseImageResponse(res);
    }

    async findAttachedImages(ownerType: ImageTypeEnum, ownerId: string) {
        const res = await grpcCall(this.fileService.findAttachedImages({ ownerType, ownerId }));
        return this.parseImageListResponse(res);
    }

    // --- Video helpers ---

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

    private parseVideoListResponse(res: VideoListResponse) {
        return { videos: (res.videos ?? []).map((r) => this.parseVideoRecord(r)) };
    }

    async uploadVideo(
        stream: Readable, originalname: string, mimetype: string, opts: StreamUploadOptions,
    ) {
        const res = await grpcStreamUpload(
            (c$) => this.fileService.uploadVideo(c$),
            stream,
            { originalname, mimetype, ownerId: '' },
            opts,
        );
        return this.parseVideoResponse(res);
    }

    removeVideo(id: string): Promise<EmptyFileResponse> {
        return grpcCall(this.fileService.removeVideo({ id }));
    }

    unattachVideo(videoId: string): Promise<EmptyFileResponse> {
        return grpcCall(this.fileService.unattachVideo({ id: videoId }));
    }

    async attachVideo(videoId: string, dto: { ownerType: string; ownerId: string }) {
        const res = await grpcCall(this.fileService.attachVideo({
            videoId,
            ownerType: dto.ownerType,
            ownerId: dto.ownerId,
        }));
        return this.parseVideoResponse(res);
    }

    async findAttachedVideos(ownerType: string, ownerId: string) {
        const res = await grpcCall(this.fileService.findAttachedVideos({ ownerType, ownerId }));
        return this.parseVideoListResponse(res);
    }

    // --- Access control ---

    getFileAccess(id: string, type: string): Promise<FileAccessResponse> {
        return grpcCall(this.fileService.getFileAccess({ id, type }));
    }

    // --- Documents ---

    private normalizeDocument(doc: DocumentRecord): DocumentRecord {
        return { ...doc, sizeBytes: Number(doc.sizeBytes ?? 0) };
    }

    private toDocumentResponse(res: DocumentResponse) {
        return { document: res.document ? this.normalizeDocument(res.document) : res.document };
    }

    private toDocumentListResponse(res: DocumentListResponse) {
        return { documents: (res.documents ?? []).map(d => this.normalizeDocument(d)) };
    }

    async uploadDocument(
        stream: Readable, originalname: string, mimetype: string,
        ownerType: string, ownerId: string, opts: StreamUploadOptions,
    ) {
        const res = await grpcStreamUpload(
            (c$) => this.fileService.uploadDocument(c$),
            stream,
            // `visibility` carries ownerType for the generic path; see
            // file-service's UploadDocument @GrpcStreamMethod handler.
            { originalname, mimetype, ownerId, visibility: ownerType },
            opts,
        );
        return this.toDocumentResponse(res);
    }

    async getDocumentsByOwner(ownerType: string, ownerId: string) {
        const res = await grpcCall(this.fileService.getDocumentsByOwner({ ownerType, ownerId }));
        return this.toDocumentListResponse(res);
    }
}
