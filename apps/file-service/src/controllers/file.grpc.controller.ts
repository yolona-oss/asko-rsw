import { Controller } from '@nestjs/common';
import { GrpcMethod, GrpcStreamMethod, RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { ImageService } from 'services/image.service';
import { VideoService } from 'services/video.service';
import { ImageCleanupService } from 'services/image-cleanup.service';
import { DocumentService } from 'services/document.service';
import { AppError, AppErrors } from 'common/error';
import { toAccessParams } from 'common/file-access.helper';
import { ImageTypeEnum, VideoTypeEnum } from '@asko/shared';
import { PassThrough, Readable } from 'stream';
import { Observable } from 'rxjs';
import type {
    UploadChunk,
    UploadStart,
    CreateFromUrlRequest,
    ImageIdRequest,
    AttachImageRequest,
    FindAttachedRequest,
    CountAttachedRequest,
    ReorderImagesRequest,
    ReorderByIdsRequest,
    VideoIdRequest,
    AttachVideoRequest,
    GetFileAccessRequest,
    FileAccessResponse,
    DocumentIdRequest,
    DocumentResponse,
    DocumentListResponse,
} from '@asko/proto';
import type { Image } from 'entities/image.entity';
import type { Video } from 'entities/video.entity';
import type { Document } from 'entities/document.entity';

function toGrpcError(error: unknown): RpcException {
    if (error instanceof AppError) {
        let grpcCode: number;
        switch (true) {
            case error.httpStatus === 400: grpcCode = status.INVALID_ARGUMENT; break;
            case error.httpStatus === 401: grpcCode = status.UNAUTHENTICATED; break;
            case error.httpStatus === 403: grpcCode = status.PERMISSION_DENIED; break;
            case error.httpStatus === 404: grpcCode = status.NOT_FOUND; break;
            case error.httpStatus === 409: grpcCode = status.ALREADY_EXISTS; break;
            default: grpcCode = status.INTERNAL; break;
        }
        return new RpcException({ code: grpcCode, message: error.message });
    }
    const msg = error instanceof Error ? error.message : 'Internal error';
    return new RpcException({ code: status.INTERNAL, message: msg });
}

// toMulterFile helper removed — all upload RPCs are now client-streaming.

function entityToRecord(entity: Image) {
    return {
        id: entity.id,
        imageJson: JSON.stringify(entity.image),
        alt: entity.alt ?? '',
        order: entity.order,
        ownerType: entity.ownerType ?? '',
        ownerId: entity.ownerId ?? '',
        createdAt: entity.createdAt?.toISOString() ?? '',
        updatedAt: entity.updatedAt?.toISOString() ?? '',
    };
}

function videoEntityToRecord(entity: Video) {
    return {
        id: entity.id,
        videoJson: JSON.stringify(entity.video),
        order: entity.order,
        ownerType: entity.ownerType ?? '',
        ownerId: entity.ownerId ?? '',
        createdAt: entity.createdAt?.toISOString() ?? '',
        updatedAt: entity.updatedAt?.toISOString() ?? '',
    };
}

function documentToRecord(entity: Document) {
    return {
        id: entity.id,
        filename: entity.filename,
        mimeType: entity.mimeType,
        sizeBytes: Number(entity.sizeBytes ?? 0),
        ownerType: entity.ownerType,
        ownerId: entity.ownerId,
        storageUrl: entity.storageUrl,
        publicId: entity.publicId ?? '',
        createdAt: entity.createdAt?.toISOString() ?? '',
    };
}

@Controller()
export class FileGrpcController {
    constructor(
        private readonly imageService: ImageService,
        private readonly videoService: VideoService,
        private readonly cleanupService: ImageCleanupService,
        private readonly documentService: DocumentService,
    ) {}

    /**
     * Drive a client-streaming upload: assemble a PassThrough from the
     * incoming `UploadChunk` stream (first message carries `start`,
     * subsequent ones carry `data`), then hand the stream to the service.
     *
     * The PassThrough is ended when the incoming gRPC stream completes;
     * the service promise resolves only after the storage provider has
     * drained it, so back-pressure stays natural.
     */
    private toStreamUpload<Resp>(
        in$: Observable<UploadChunk>,
        run: (pt: PassThrough, meta: UploadStart) => Promise<Resp>,
    ): Observable<Resp> {
        return new Observable<Resp>((subscriber) => {
            const pt = new PassThrough();
            let meta: UploadStart | undefined;
            let serviceResult: Promise<Resp> | undefined;

            const startService = () => {
                if (!meta || serviceResult) return;
                serviceResult = run(pt, meta);
                serviceResult
                    .then((r) => { subscriber.next(r); subscriber.complete(); })
                    .catch((e) => subscriber.error(toGrpcError(e)));
            };

            const sub = in$.subscribe({
                next: (msg) => {
                    if (msg.start) {
                        meta = msg.start;
                        startService();
                    } else if (msg.data && msg.data.length > 0) {
                        pt.write(Buffer.from(msg.data));
                    }
                },
                error: (e) => {
                    pt.destroy(e instanceof Error ? e : new Error(String(e)));
                    subscriber.error(toGrpcError(e));
                },
                complete: () => {
                    if (!meta) {
                        subscriber.error(toGrpcError(AppErrors.badRequest('Missing UploadStart')));
                        return;
                    }
                    pt.end();
                    // service promise (started on first chunk) will complete on its own
                },
            });

            return () => sub.unsubscribe();
        });
    }

    // ─── Upload operations ──────────────────────────────────────────────

    @GrpcStreamMethod('FileService', 'Upload')
    upload(in$: Observable<UploadChunk>) {
        return this.toStreamUpload(in$, async (pt, meta) => {
            const image = await this.imageService.uploadStreamGeneric(
                pt,
                { originalname: meta.originalname, mimetype: meta.mimetype, alt: meta.alt },
                toAccessParams(meta),
            );
            return { image: entityToRecord(image) };
        });
    }

    @GrpcStreamMethod('FileService', 'UploadUserAvatar')
    uploadUserAvatar(in$: Observable<UploadChunk>) {
        return this.toStreamUpload(in$, async (pt, meta) => {
            const image = await this.imageService.uploadUserAvatarStream(
                pt, { originalname: meta.originalname, mimetype: meta.mimetype }, meta.ownerId,
                toAccessParams(meta),
            );
            return { image: entityToRecord(image) };
        });
    }

    @GrpcStreamMethod('FileService', 'UploadDeviceImage')
    uploadDeviceImage(in$: Observable<UploadChunk>) {
        return this.toStreamUpload(in$, async (pt, meta) => {
            const image = await this.imageService.uploadDeviceImageStream(
                pt, { originalname: meta.originalname, mimetype: meta.mimetype }, meta.ownerId,
                toAccessParams(meta),
            );
            return { image: entityToRecord(image) };
        });
    }

    @GrpcStreamMethod('FileService', 'UploadArticleImage')
    uploadArticleImage(in$: Observable<UploadChunk>) {
        return this.toStreamUpload(in$, async (pt, meta) => {
            const image = await this.imageService.uploadArticleImageStream(
                pt, { originalname: meta.originalname, mimetype: meta.mimetype }, meta.ownerId,
                toAccessParams(meta),
            );
            return { image: entityToRecord(image) };
        });
    }

    @GrpcStreamMethod('FileService', 'UploadRepairRequestImage')
    uploadRepairRequestImage(in$: Observable<UploadChunk>) {
        return this.toStreamUpload(in$, async (pt, meta) => {
            const image = await this.imageService.uploadRepairRequestImageStream(
                pt, { originalname: meta.originalname, mimetype: meta.mimetype }, meta.ownerId,
                toAccessParams(meta),
            );
            return { image: entityToRecord(image) };
        });
    }

    @GrpcStreamMethod('FileService', 'UploadReviewImage')
    uploadReviewImage(in$: Observable<UploadChunk>) {
        return this.toStreamUpload(in$, async (pt, meta) => {
            const image = await this.imageService.uploadReviewImageStream(
                pt, { originalname: meta.originalname, mimetype: meta.mimetype }, meta.ownerId,
                toAccessParams(meta),
            );
            return { image: entityToRecord(image) };
        });
    }

    @GrpcStreamMethod('FileService', 'UploadDevicePartImage')
    uploadDevicePartImage(in$: Observable<UploadChunk>) {
        return this.toStreamUpload(in$, async (pt, meta) => {
            const image = await this.imageService.uploadDevicePartImageStream(
                pt, { originalname: meta.originalname, mimetype: meta.mimetype }, meta.ownerId,
                toAccessParams(meta),
            );
            return { image: entityToRecord(image) };
        });
    }

    @GrpcStreamMethod('FileService', 'UploadBrokenPartImage')
    uploadBrokenPartImage(in$: Observable<UploadChunk>) {
        return this.toStreamUpload(in$, async (pt, meta) => {
            const image = await this.imageService.uploadBrokenPartImageStream(
                pt, { originalname: meta.originalname, mimetype: meta.mimetype }, meta.ownerId,
                toAccessParams(meta),
            );
            return { image: entityToRecord(image) };
        });
    }

    // ─── URL operations ─────────────────────────────────────────────────

    @GrpcMethod('FileService', 'CreateFromUrl')
    async createFromUrl(data: CreateFromUrlRequest) {
        try {
            const image = await this.imageService.createFromUrl(
                data.url,
                (data.ownerType || undefined) as ImageTypeEnum | undefined,
                data.ownerId || undefined,
                data.order || undefined,
            );
            return { image: entityToRecord(image) };
        } catch (e) { throw toGrpcError(e); }
    }

    // ─── Management operations ──────────────────────────────────────────

    @GrpcMethod('FileService', 'Remove')
    async remove(data: ImageIdRequest) {
        try {
            await this.imageService.remove(data.id);
            return {};
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('FileService', 'UnattachImage')
    async unattachImage(data: ImageIdRequest) {
        try {
            await this.imageService.unattachImage(data.id);
            return {};
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('FileService', 'AttachImage')
    async attachImage(data: AttachImageRequest) {
        try {
            const image = await this.imageService.attachImage(
                data.imageId,
                data.ownerType as ImageTypeEnum,
                data.ownerId,
            );
            return { image: entityToRecord(image) };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('FileService', 'FindAttachedImages')
    async findAttachedImages(data: FindAttachedRequest) {
        try {
            const images = await this.imageService.findAttachedImages(
                data.ownerType as ImageTypeEnum,
                data.ownerId,
            );
            return { images: images.map(entityToRecord) };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('FileService', 'CountAttached')
    async countAttached(data: CountAttachedRequest) {
        try {
            const count = await this.imageService.countAttached(
                data.ownerId,
                data.ownerType as ImageTypeEnum,
            );
            return { count };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('FileService', 'DeleteByOwner')
    async deleteByOwner(data: FindAttachedRequest) {
        try {
            const count = await this.cleanupService.deleteByOwner(
                data.ownerType as ImageTypeEnum,
                data.ownerId,
            );
            return { count };
        } catch (e) { throw toGrpcError(e); }
    }

    // ─── Reorder operations ─────────────────────────────────────────────

    @GrpcMethod('FileService', 'ReorderImages')
    async reorderImages(data: ReorderImagesRequest) {
        try {
            await this.imageService.reorderImages(
                data.ownerType as ImageTypeEnum,
                data.ownerId,
                data.schema,
            );
            return {};
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('FileService', 'ReorderByIds')
    async reorderByIds(data: ReorderByIdsRequest) {
        try {
            const images = await this.imageService.reorderByIds(
                data.ownerType as ImageTypeEnum,
                data.ownerId,
                data.imageIds,
            );
            return { images: images.map(entityToRecord) };
        } catch (e) { throw toGrpcError(e); }
    }

    // ─── Video operations ────────────────────────────────────────────────

    @GrpcStreamMethod('FileService', 'UploadVideo')
    uploadVideo(in$: Observable<UploadChunk>) {
        return this.toStreamUpload(in$, async (pt, meta) => {
            const video = await this.videoService.uploadStreamGeneric(
                pt,
                { originalname: meta.originalname, mimetype: meta.mimetype },
                toAccessParams(meta),
            );
            return { video: videoEntityToRecord(video) };
        });
    }

    @GrpcStreamMethod('FileService', 'UploadRepairRequestVideo')
    uploadRepairRequestVideo(in$: Observable<UploadChunk>) {
        return this.toStreamUpload(in$, async (pt, meta) => {
            const video = await this.videoService.uploadRepairRequestVideoStream(
                pt,
                { originalname: meta.originalname, mimetype: meta.mimetype },
                meta.ownerId,
                toAccessParams(meta),
            );
            return { video: videoEntityToRecord(video) };
        });
    }

    @GrpcStreamMethod('FileService', 'UploadReviewVideo')
    uploadReviewVideo(in$: Observable<UploadChunk>) {
        return this.toStreamUpload(in$, async (pt, meta) => {
            const video = await this.videoService.uploadReviewVideoStream(
                pt, { originalname: meta.originalname, mimetype: meta.mimetype }, meta.ownerId,
                toAccessParams(meta),
            );
            return { video: videoEntityToRecord(video) };
        });
    }

    @GrpcStreamMethod('FileService', 'UploadDeviceVideo')
    uploadDeviceVideo(in$: Observable<UploadChunk>) {
        return this.toStreamUpload(in$, async (pt, meta) => {
            const video = await this.videoService.uploadDeviceVideoStream(
                pt, { originalname: meta.originalname, mimetype: meta.mimetype }, meta.ownerId,
                toAccessParams(meta),
            );
            return { video: videoEntityToRecord(video) };
        });
    }

    @GrpcStreamMethod('FileService', 'UploadArticleVideo')
    uploadArticleVideo(in$: Observable<UploadChunk>) {
        return this.toStreamUpload(in$, async (pt, meta) => {
            const video = await this.videoService.uploadArticleVideoStream(
                pt, { originalname: meta.originalname, mimetype: meta.mimetype }, meta.ownerId,
                toAccessParams(meta),
            );
            return { video: videoEntityToRecord(video) };
        });
    }

    @GrpcMethod('FileService', 'RemoveVideo')
    async removeVideo(data: VideoIdRequest) {
        try {
            await this.videoService.remove(data.id);
            return {};
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('FileService', 'FindAttachedVideos')
    async findAttachedVideos(data: FindAttachedRequest) {
        try {
            const videos = await this.videoService.findAttachedVideos(
                data.ownerType as VideoTypeEnum,
                data.ownerId,
            );
            return { videos: videos.map(videoEntityToRecord) };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('FileService', 'AttachVideo')
    async attachVideo(data: AttachVideoRequest) {
        try {
            const video = await this.videoService.attachVideo(
                data.videoId,
                data.ownerType as VideoTypeEnum,
                data.ownerId,
            );
            return { video: videoEntityToRecord(video) };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('FileService', 'UnattachVideo')
    async unattachVideo(data: VideoIdRequest) {
        try {
            await this.videoService.unattachVideo(data.id);
            return {};
        } catch (e) { throw toGrpcError(e); }
    }

    // ─── Document operations ────────────────────────────────────────────

    @GrpcStreamMethod('FileService', 'UploadBrokenPartDocument')
    uploadBrokenPartDocument(in$: Observable<UploadChunk>) {
        return this.toStreamUpload(in$, async (pt, meta) => {
            const doc = await this.documentService.uploadBrokenPartDocumentStream(
                pt,
                { originalname: meta.originalname, mimetype: meta.mimetype },
                meta.ownerId,
                toAccessParams(meta),
            );
            return { document: documentToRecord(doc) };
        });
    }

    @GrpcStreamMethod('FileService', 'UploadRepairRequestDocument')
    uploadRepairRequestDocument(in$: Observable<UploadChunk>) {
        return this.toStreamUpload(in$, async (pt, meta) => {
            const doc = await this.documentService.uploadRepairRequestDocumentStream(
                pt,
                { originalname: meta.originalname, mimetype: meta.mimetype },
                meta.ownerId,
                toAccessParams(meta),
            );
            return { document: documentToRecord(doc) };
        });
    }

    @GrpcStreamMethod('FileService', 'UploadDocument')
    uploadDocument(in$: Observable<UploadChunk>) {
        return this.toStreamUpload(in$, async (pt, meta) => {
            // `visibility` field is reused to carry ownerType for the generic
            // path, so we drop it from AccessParams (no real visibility policy
            // arrives on this RPC) and pass through only creatorId + conversationId.
            const doc = await this.documentService.uploadStreamDocument(
                pt,
                { originalname: meta.originalname, mimetype: meta.mimetype },
                meta.visibility || '',
                meta.ownerId,
                toAccessParams({
                    creatorId: meta.creatorId,
                    conversationId: meta.conversationId,
                }),
            );
            return { document: documentToRecord(doc) };
        });
    }

    @GrpcMethod('FileService', 'GetDocument')
    async getDocument(data: DocumentIdRequest): Promise<DocumentResponse> {
        try {
            const doc = await this.documentService.findOne(data.id);
            return { document: documentToRecord(doc) };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('FileService', 'GetDocumentsByOwner')
    async getDocumentsByOwner(data: FindAttachedRequest): Promise<DocumentListResponse> {
        try {
            const docs = await this.documentService.findByOwner(data.ownerType, data.ownerId);
            return { documents: docs.map(documentToRecord) };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('FileService', 'DeleteDocument')
    async deleteDocument(data: DocumentIdRequest) {
        try {
            await this.documentService.remove(data.id);
            return {};
        } catch (e) { throw toGrpcError(e); }
    }

    // ─── Access control ─────────────────────────────────────────────────

    @GrpcMethod('FileService', 'GetFileAccess')
    async getFileAccess(data: GetFileAccessRequest): Promise<FileAccessResponse> {
        try {
            let storageUrl = '';
            let publicId = '';
            let access: any = null;

            if (data.type === 'video') {
                const video = await this.videoService.findOne(data.id);
                storageUrl = video.video?.secure_url ?? video.video?.url ?? '';
                publicId = video.video?.public_id ?? '';
                access = await this.videoService.findAccess(data.id);
            } else if (data.type === 'document') {
                const doc = await this.documentService.findOne(data.id);
                storageUrl = doc.storageUrl;
                publicId = doc.publicId ?? '';
                access = await this.documentService.findAccess(data.id);
            } else {
                const image = await this.imageService.findOne(data.id);
                storageUrl = image.image?.original?.secure_url ?? image.image?.original?.url ?? '';
                publicId = image.image?.original?.public_id ?? '';
                access = await this.imageService.findAccess(data.id);
            }

            return {
                id: data.id,
                visibility: access?.visibility ?? 'public',
                creatorId: access?.creatorId ?? '',
                conversationId: access?.conversationId ?? '',
                storageUrl,
                publicId,
            };
        } catch (e) { throw toGrpcError(e); }
    }
}
