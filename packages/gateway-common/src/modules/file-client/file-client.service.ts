import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import type { Readable } from 'node:stream';

import { grpcCall, grpcStreamUpload } from '../../grpc';
import type { StreamUploadOptions } from '../../grpc';

import type {
    FileServiceClient,
    ImageRecord,
    ImageResponse,
    ImageListResponse,
    CountResponse,
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
 * Base gRPC client for file-service, shared by every gateway.
 *
 * Provides:
 *  - parse helpers for image/video/document records
 *  - common (non-domain-specific) RPCs: attach, find, reorder, remove, access,
 *    generic upload/uploadVideo/uploadDocument.
 *
 * Gateway-specific domain uploads (e.g. uploadUserAvatar, uploadArticleImage,
 * uploadRepairRequestImage) are declared in the subclass that owns the domain.
 */
@Injectable()
export class FileClientService implements OnModuleInit {
    protected fileService!: FileServiceClient;

    constructor(
        @Inject('FILE_PACKAGE') private readonly client: ClientGrpc,
    ) {}

    onModuleInit() {
        this.fileService = this.client.getService<FileServiceClient>('FileService');
    }

    // ─── Parse helpers ──────────────────────────────────────────────────

    protected parseRecord(record: ImageRecord): ImageRecord & { imageJson: any } {
        try {
            return { ...record, imageJson: JSON.parse(record.imageJson) };
        } catch {
            return record as any;
        }
    }

    protected parseImageResponse(res: ImageResponse) {
        return { image: this.parseRecord(res.image) };
    }

    protected parseImageListResponse(res: ImageListResponse) {
        return { images: (res.images ?? []).map((r) => this.parseRecord(r)) };
    }

    protected parseVideoRecord(record: VideoRecord): VideoRecord & { videoJson: any } {
        try {
            return { ...record, videoJson: JSON.parse(record.videoJson) };
        } catch {
            return record as any;
        }
    }

    protected parseVideoResponse(res: VideoResponse) {
        return { video: this.parseVideoRecord(res.video) };
    }

    protected parseVideoListResponse(res: VideoListResponse) {
        return { videos: (res.videos ?? []).map((r) => this.parseVideoRecord(r)) };
    }

    protected normalizeDocument(doc: DocumentRecord): DocumentRecord {
        return { ...doc, sizeBytes: Number(doc.sizeBytes ?? 0) };
    }

    protected toDocumentResponse(res: DocumentResponse) {
        return { document: res.document ? this.normalizeDocument(res.document) : res.document };
    }

    protected toDocumentListResponse(res: DocumentListResponse) {
        return { documents: (res.documents ?? []).map((d) => this.normalizeDocument(d)) };
    }

    // ─── Generic image uploads (admin / shared) ─────────────────────────

    async upload(
        stream: Readable, originalname: string, mimetype: string,
        opts: StreamUploadOptions, alt?: string,
    ) {
        const res = await grpcStreamUpload(
            (c$) => this.fileService.upload(c$),
            stream,
            { originalname, mimetype, ownerId: '', alt: alt ?? '' },
            opts,
        );
        return this.parseImageResponse(res);
    }

    async createFromUrl(url: string, ownerType?: string, ownerId?: string, order?: number) {
        const res = await grpcCall(this.fileService.createFromUrl({
            url,
            ownerType: ownerType ?? '',
            ownerId: ownerId ?? '',
            order: order ?? 0,
        }));
        return this.parseImageResponse(res);
    }

    // ─── Image management ───────────────────────────────────────────────

    remove(id: string): Promise<EmptyFileResponse> {
        return grpcCall(this.fileService.remove({ id }));
    }

    unattachImage(imageId: string): Promise<EmptyFileResponse> {
        return grpcCall(this.fileService.unattachImage({ id: imageId }));
    }

    async attachImage(imageId: string, dto: { ownerType: string; ownerId: string }) {
        const res = await grpcCall(this.fileService.attachImage({
            imageId,
            ownerType: dto.ownerType,
            ownerId: dto.ownerId,
        }));
        return this.parseImageResponse(res);
    }

    async findAttachedImages(ownerType: string, ownerId: string) {
        const res = await grpcCall(this.fileService.findAttachedImages({ ownerType, ownerId }));
        return this.parseImageListResponse(res);
    }

    countAttached(ownerId: string, ownerType: string): Promise<CountResponse> {
        return grpcCall(this.fileService.countAttached({ ownerId, ownerType }));
    }

    deleteByOwner(ownerType: string, ownerId: string): Promise<CountResponse> {
        return grpcCall(this.fileService.deleteByOwner({ ownerType, ownerId }));
    }

    reorderImages(
        ownerType: string,
        ownerId: string,
        schema: { id: string; order: number }[],
    ): Promise<EmptyFileResponse> {
        return grpcCall(this.fileService.reorderImages({ ownerType, ownerId, schema }));
    }

    async reorderByIds(ownerType: string, ownerId: string, imageIds: string[]) {
        const res = await grpcCall(this.fileService.reorderByIds({ ownerType, ownerId, imageIds }));
        return this.parseImageListResponse(res);
    }

    // ─── Videos ─────────────────────────────────────────────────────────

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

    // ─── Documents ──────────────────────────────────────────────────────

    async uploadDocument(
        stream: Readable, originalname: string, mimetype: string,
        ownerType: string, ownerId: string, opts: StreamUploadOptions, creatorId?: string,
    ): Promise<DocumentResponse> {
        const res = await grpcStreamUpload(
            (c$) => this.fileService.uploadDocument(c$),
            stream,
            // `visibility` carries ownerType for the generic path; see
            // file-service's UploadDocument @GrpcStreamMethod handler.
            { originalname, mimetype, ownerId, visibility: ownerType, creatorId: creatorId ?? '' },
            opts,
        );
        return this.toDocumentResponse(res);
    }

    async getDocument(id: string): Promise<DocumentRecord> {
        const res = await grpcCall(this.fileService.getDocument({ id }));
        return res.document;
    }

    async getDocumentsByOwner(ownerType: string, ownerId: string): Promise<DocumentListResponse> {
        const res = await grpcCall(this.fileService.getDocumentsByOwner({ ownerType, ownerId }));
        return this.toDocumentListResponse(res);
    }

    deleteDocument(id: string): Promise<EmptyFileResponse> {
        return grpcCall(this.fileService.deleteDocument({ id }));
    }

    // ─── Access control ─────────────────────────────────────────────────

    getFileAccess(id: string, type: string): Promise<FileAccessResponse> {
        return grpcCall(this.fileService.getFileAccess({ id, type }));
    }
}
