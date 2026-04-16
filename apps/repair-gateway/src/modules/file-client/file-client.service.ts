import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { grpcCall, grpcStreamUpload, type StreamUploadOptions } from '@asko/gateway-common';
import { ImageTypeEnum } from '@asko/shared';
import { Readable } from 'node:stream';

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

@Injectable()
export class FileClientService implements OnModuleInit {
    private fileService!: FileServiceClient;

    constructor(
        @Inject('FILE_PACKAGE') private readonly client: ClientGrpc,
    ) {}

    onModuleInit() {
        this.fileService = this.client.getService<FileServiceClient>('FileService');
    }

    /** Parse imageJson from gRPC string to object for REST responses */
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

    // ─── Upload operations ──────────────────────────────────────────────

    async uploadRepairRequestImage(
        stream: Readable, originalname: string, mimetype: string, ownerId: string, opts: StreamUploadOptions,
    ) {
        const res = await grpcStreamUpload(
            (c$) => this.fileService.uploadRepairRequestImage(c$),
            stream, { originalname, mimetype, ownerId }, opts,
        );
        return this.parseImageResponse(res);
    }

    async uploadReviewImage(
        stream: Readable, originalname: string, mimetype: string, ownerId: string, opts: StreamUploadOptions,
    ) {
        const res = await grpcStreamUpload(
            (c$) => this.fileService.uploadReviewImage(c$),
            stream, { originalname, mimetype, ownerId }, opts,
        );
        return this.parseImageResponse(res);
    }

    async uploadDeviceImage(
        stream: Readable, originalname: string, mimetype: string, ownerId: string, opts: StreamUploadOptions,
    ) {
        const res = await grpcStreamUpload(
            (c$) => this.fileService.uploadDeviceImage(c$),
            stream, { originalname, mimetype, ownerId }, opts,
        );
        return this.parseImageResponse(res);
    }

    async uploadDevicePartImage(
        stream: Readable, originalname: string, mimetype: string, ownerId: string, opts: StreamUploadOptions,
    ) {
        const res = await grpcStreamUpload(
            (c$) => this.fileService.uploadDevicePartImage(c$),
            stream, { originalname, mimetype, ownerId }, opts,
        );
        return this.parseImageResponse(res);
    }

    async uploadBrokenPartImage(
        stream: Readable, originalname: string, mimetype: string, ownerId: string, opts: StreamUploadOptions,
    ) {
        const res = await grpcStreamUpload(
            (c$) => this.fileService.uploadBrokenPartImage(c$),
            stream, { originalname, mimetype, ownerId }, opts,
        );
        return this.parseImageResponse(res);
    }

    // ─── URL operations ─────────────────────────────────────────────────

    async createFromUrl(url: string, ownerType?: ImageTypeEnum, ownerId?: string, order?: number) {
        const res = await grpcCall(this.fileService.createFromUrl({
            url,
            ownerType: ownerType ?? '',
            ownerId: ownerId ?? '',
            order: order ?? 0,
        }));
        return this.parseImageResponse(res);
    }

    // ─── Management operations ──────────────────────────────────────────

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

    countAttached(ownerId: string, ownerType: ImageTypeEnum): Promise<CountResponse> {
        return grpcCall(this.fileService.countAttached({ ownerId, ownerType }));
    }

    deleteByOwner(ownerType: ImageTypeEnum, ownerId: string): Promise<CountResponse> {
        return grpcCall(this.fileService.deleteByOwner({ ownerType, ownerId }));
    }

    // ─── Reorder operations ─────────────────────────────────────────────

    reorderImages(ownerType: ImageTypeEnum, ownerId: string, schema: { id: string; order: number }[]): Promise<EmptyFileResponse> {
        return grpcCall(this.fileService.reorderImages({ ownerType, ownerId, schema }));
    }

    async reorderByIds(ownerType: ImageTypeEnum, ownerId: string, imageIds: string[]) {
        const res = await grpcCall(this.fileService.reorderByIds({ ownerType, ownerId, imageIds }));
        return this.parseImageListResponse(res);
    }

    // ─── Video helpers ───────────────────────────────────────────────────

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

    // ─── Video upload operations ─────────────────────────────────────────

    async uploadRepairRequestVideo(
        stream: Readable,
        originalname: string,
        mimetype: string,
        ownerId: string,
        opts: StreamUploadOptions,
    ) {
        const res = await grpcStreamUpload(
            (chunks$) => this.fileService.uploadRepairRequestVideo(chunks$),
            stream,
            { originalname, mimetype, ownerId },
            opts,
        );
        return this.parseVideoResponse(res);
    }

    async uploadReviewVideo(
        stream: Readable, originalname: string, mimetype: string, ownerId: string, opts: StreamUploadOptions,
    ) {
        const res = await grpcStreamUpload(
            (c$) => this.fileService.uploadReviewVideo(c$),
            stream, { originalname, mimetype, ownerId }, opts,
        );
        return this.parseVideoResponse(res);
    }

    async uploadDeviceVideo(
        stream: Readable, originalname: string, mimetype: string, ownerId: string, opts: StreamUploadOptions,
    ) {
        const res = await grpcStreamUpload(
            (c$) => this.fileService.uploadDeviceVideo(c$),
            stream, { originalname, mimetype, ownerId }, opts,
        );
        return this.parseVideoResponse(res);
    }

    // ─── Video management operations ─────────────────────────────────────

    removeVideo(id: string): Promise<EmptyFileResponse> {
        return grpcCall(this.fileService.removeVideo({ id }));
    }

    async findAttachedVideos(ownerType: string, ownerId: string) {
        const res = await grpcCall(this.fileService.findAttachedVideos({ ownerType, ownerId }));
        return this.parseVideoListResponse(res);
    }

    // ─── Documents ────────────────────────────────────────────────────────

    /**
     * Internal helper for the AVR flow: file-service generates a PDF buffer
     * in-process, then we stream it to file-service's generic document RPC.
     * The buffer-to-stream hop is only ~200 KB–1 MB so the overhead is nil.
     */
    async uploadDocument(pdfBuffer: Buffer, filename: string, ownerType: string, ownerId: string, creatorId?: string): Promise<DocumentResponse> {
        return grpcStreamUpload(
            (c$) => this.fileService.uploadDocument(c$),
            Readable.from(pdfBuffer),
            { originalname: filename, mimetype: 'application/pdf', ownerId, visibility: ownerType, creatorId: creatorId ?? '' },
            { maxBytes: 50 * 1024 * 1024 },
        );
    }

    async uploadDocumentFile(file: Express.Multer.File, ownerType: string, ownerId: string, creatorId?: string): Promise<DocumentResponse> {
        return grpcStreamUpload(
            (c$) => this.fileService.uploadDocument(c$),
            Readable.from(file.buffer),
            { originalname: file.originalname, mimetype: file.mimetype, ownerId, visibility: ownerType, creatorId: creatorId ?? '' },
            { maxBytes: 50 * 1024 * 1024 },
        );
    }

    async uploadRepairRequestDocument(
        stream: Readable, originalname: string, mimetype: string, ownerId: string,
        opts: StreamUploadOptions, creatorId?: string,
    ): Promise<DocumentResponse> {
        return grpcStreamUpload(
            (c$) => this.fileService.uploadRepairRequestDocument(c$),
            stream,
            { originalname, mimetype, ownerId, visibility: 'role_restricted', creatorId: creatorId ?? '' },
            opts,
        );
    }

    async uploadBrokenPartDocument(
        stream: Readable, originalname: string, mimetype: string, ownerId: string,
        opts: StreamUploadOptions, creatorId?: string,
    ): Promise<DocumentResponse> {
        return grpcStreamUpload(
            (c$) => this.fileService.uploadBrokenPartDocument(c$),
            stream,
            { originalname, mimetype, ownerId, visibility: 'role_restricted', creatorId: creatorId ?? '' },
            opts,
        );
    }

    async getDocument(id: string): Promise<DocumentRecord> {
        const res = await grpcCall(this.fileService.getDocument({ id }));
        return res.document;
    }

    async getDocumentsByOwner(ownerType: string, ownerId: string): Promise<DocumentListResponse> {
        return grpcCall(this.fileService.getDocumentsByOwner({ ownerType, ownerId }));
    }

    deleteDocument(id: string): Promise<EmptyFileResponse> {
        return grpcCall(this.fileService.deleteDocument({ id }));
    }

    // ─── Access control ──────────────────────────────────────────────────

    getFileAccess(id: string, type: string): Promise<FileAccessResponse> {
        return grpcCall(this.fileService.getFileAccess({ id, type }));
    }
}
