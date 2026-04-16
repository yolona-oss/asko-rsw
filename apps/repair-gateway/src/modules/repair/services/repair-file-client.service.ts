import { Injectable } from '@nestjs/common';
import { FileClientService, grpcStreamUpload, type StreamUploadOptions } from '@asko/gateway-common';
import type { DocumentResponse } from '@asko/proto';
import { Readable } from 'node:stream';

/**
 * Repair-gateway-local file client: adds per-domain upload RPCs (repair
 * request, review, device, device part, broken part) on top of the shared
 * base. These belong to the repair domain and live here rather than in
 * gateway-common.
 */
@Injectable()
export class RepairFileClientService extends FileClientService {
    // ─── Image uploads ──────────────────────────────────────────────────

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

    // ─── Video uploads ──────────────────────────────────────────────────

    async uploadRepairRequestVideo(
        stream: Readable, originalname: string, mimetype: string, ownerId: string, opts: StreamUploadOptions,
    ) {
        const res = await grpcStreamUpload(
            (c$) => this.fileService.uploadRepairRequestVideo(c$),
            stream, { originalname, mimetype, ownerId }, opts,
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

    // ─── Document uploads ───────────────────────────────────────────────

    /**
     * AVR flow: file-service generates a PDF buffer in-process, then we
     * stream it back to the generic document RPC. The buffer-to-stream hop
     * is only ~200 KB–1 MB so the overhead is nil.
     */
    async uploadDocumentBuffer(
        pdfBuffer: Buffer, filename: string, ownerType: string, ownerId: string, creatorId?: string,
    ): Promise<DocumentResponse> {
        return grpcStreamUpload(
            (c$) => this.fileService.uploadDocument(c$),
            Readable.from(pdfBuffer),
            { originalname: filename, mimetype: 'application/pdf', ownerId, visibility: ownerType, creatorId: creatorId ?? '' },
            { maxBytes: 50 * 1024 * 1024 },
        );
    }

    async uploadDocumentFile(
        file: Express.Multer.File, ownerType: string, ownerId: string, creatorId?: string,
    ): Promise<DocumentResponse> {
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
}
