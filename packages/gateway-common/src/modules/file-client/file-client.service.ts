import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import type { Readable } from 'node:stream';

import { grpcCall, grpcStreamUpload } from '../../grpc';
import type { StreamUploadOptions } from '../../grpc';

import { FileVisibility } from '@asko/shared';
import type {
    FileServiceClient,
    UploadStart,
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
    UploadFileResponse,
} from '@asko/proto';

export interface UploadFileParams {
    ownerType?: string;
    ownerId?: string;
    replaceExisting?: boolean;
    alt?: string;
    visibility?: FileVisibility;
    creatorId?: string;
    conversationId?: string;
}

@Injectable()
export class FileClientService implements OnModuleInit {
    protected fileService!: FileServiceClient;

    constructor(
        @Inject('FILE_PACKAGE') private readonly client: ClientGrpc,
    ) {}

    onModuleInit() {
        this.fileService = this.client.getService<FileServiceClient>('FileService');
    }

    // ─── URL sanitization ───────────────────────────────────────────────

    private sanitizeImageJson(id: string, parsed: any): any {
        if (!parsed || typeof parsed !== 'object') return parsed;
        const url = `/files/image/${id}`;
        const sanitize = (variant: any) => {
            if (!variant || typeof variant !== 'object') return variant;
            return {
                url,
                secure_url: url,
                width: variant.width,
                height: variant.height,
                format: variant.format,
                resource_type: variant.resource_type,
                original_filename: variant.original_filename,
            };
        };
        const result: any = {};
        for (const key of ['original', 'thumbnail', 'medium', 'large']) {
            if (parsed[key]) result[key] = sanitize(parsed[key]);
        }
        return result;
    }

    private sanitizeVideoJson(id: string, parsed: any): any {
        if (!parsed || typeof parsed !== 'object') return parsed;
        const url = `/files/video/${id}`;
        return {
            url,
            secure_url: url,
            format: parsed.format,
            resource_type: parsed.resource_type,
            original_filename: parsed.original_filename,
            duration: parsed.duration,
            size: parsed.size,
        };
    }

    // ─── Parse helpers ──────────────────────────────────────────────────

    protected parseRecord(record: ImageRecord): ImageRecord & { imageJson: any } {
        try {
            const parsed = JSON.parse(record.imageJson);
            return {
                ...record,
                imageJson: record.id ? this.sanitizeImageJson(record.id, parsed) : parsed,
            };
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
            const parsed = JSON.parse(record.videoJson);
            return {
                ...record,
                videoJson: record.id ? this.sanitizeVideoJson(record.id, parsed) : parsed,
            };
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
        return {
            ...doc,
            sizeBytes: Number(doc.sizeBytes ?? 0),
            storageUrl: doc.id ? `/files/document/${doc.id}` : doc.storageUrl,
            publicId: '',
        };
    }

    protected toDocumentResponse(res: DocumentResponse) {
        return { document: res.document ? this.normalizeDocument(res.document) : res.document };
    }

    protected toDocumentListResponse(res: DocumentListResponse) {
        return { documents: (res.documents ?? []).map((d) => this.normalizeDocument(d)) };
    }

    // ─── Raw helpers (server-side only, NOT for API responses) ──────────

    /**
     * Returns attached images with raw storage URLs (NOT sanitized).
     * Used exclusively by server-side code that needs to fetch actual file
     * bytes (e.g. certificate PDF generation). Never expose to API consumers.
     */
    async findAttachedImagesRaw(ownerType: string, ownerId: string) {
        const res = await grpcCall(this.fileService.findAttachedImages({ ownerType, ownerId }));
        return {
            images: (res.images ?? []).map((r) => {
                try {
                    return { ...r, imageJson: JSON.parse(r.imageJson) };
                } catch {
                    return r as any;
                }
            }),
        };
    }

    // ─── Unified upload ─────────────────────────────────────────────────

    async uploadFile(
        stream: Readable,
        originalname: string,
        mimetype: string,
        opts: StreamUploadOptions,
        params: UploadFileParams = {},
    ): Promise<UploadFileResponse> {
        const start: UploadStart = {
            originalname,
            mimetype,
            ownerId: params.ownerId ?? '',
            ownerType: params.ownerType ?? '',
            replaceExisting: params.replaceExisting ?? false,
            alt: params.alt ?? '',
            visibility: params.visibility ?? '',
            creatorId: params.creatorId ?? '',
            conversationId: params.conversationId ?? '',
        };

        const res = await grpcStreamUpload(
            (c$) => this.fileService.uploadFile(c$),
            stream,
            start,
            opts,
        );

        if (res.image) res.image = this.parseRecord(res.image);
        if (res.video) res.video = this.parseVideoRecord(res.video);
        if (res.document) res.document = this.normalizeDocument(res.document);

        return res;
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

    async getDocument(id: string): Promise<DocumentRecord> {
        const res = await grpcCall(this.fileService.getDocument({ id }));
        return this.normalizeDocument(res.document);
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
