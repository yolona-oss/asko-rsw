import { Controller } from '@nestjs/common';
import { GrpcMethod, GrpcStreamMethod, RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { ImageService } from 'image/image.service';
import { VideoService } from 'video/video.service';
import { ImageCleanupService } from 'image/image-cleanup.service';
import { DocumentService } from 'document/document.service';
import { UploadService } from 'upload/upload.service';
import { AppError, AppErrors } from 'common/error';
import { toAccessParams } from 'common/file-access.helper';
import { ImageTypeEnum, VideoTypeEnum } from '@asko/shared';
import type { FileAccess } from 'common/file-access.entity';
import { PassThrough } from 'stream';
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
import type { Image } from 'image/image.entity';
import type { Video } from 'video/video.entity';
import type { Document } from 'document/document.entity';

function toGrpcError(error: unknown): RpcException {
    if (error instanceof AppError) {
        let grpcCode: number;
        switch (error.httpStatus) {
            case 400: grpcCode = status.INVALID_ARGUMENT; break;
            case 401: grpcCode = status.UNAUTHENTICATED; break;
            case 403: grpcCode = status.PERMISSION_DENIED; break;
            case 404: grpcCode = status.NOT_FOUND; break;
            case 409: grpcCode = status.ALREADY_EXISTS; break;
            default: grpcCode = status.INTERNAL; break;
        }
        return new RpcException({ code: grpcCode, message: error.message });
    }
    const msg = error instanceof Error ? error.message : 'Internal error';
    return new RpcException({ code: status.INTERNAL, message: msg });
}

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
        private readonly uploadService: UploadService,
    ) {}

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
                },
            });

            return () => sub.unsubscribe();
        });
    }

    // ─── Unified upload ─────────────────────────────────────────────────

    @GrpcStreamMethod('FileService', 'UploadFile')
    uploadFile(in$: Observable<UploadChunk>) {
        return this.toStreamUpload(in$, async (pt, meta) => {
            const result = await this.uploadService.uploadFile(
                pt,
                { originalname: meta.originalname, mimetype: meta.mimetype, alt: meta.alt },
                meta.ownerType || undefined,
                meta.ownerId || undefined,
                meta.replaceExisting ?? false,
                toAccessParams(meta),
            );

            switch (result.fileType) {
                case 'image':
                    return { fileType: 'image', image: entityToRecord(result.image!) };
                case 'video':
                    return { fileType: 'video', video: videoEntityToRecord(result.video!) };
                case 'document':
                    return { fileType: 'document', document: documentToRecord(result.document!) };
            }
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

    // ─── Image management ───────────────────────────────────────────────

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

    // ─── Reorder ────────────────────────────────────────────────────────

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

    // ─── Video management ───────────────────────────────────────────────

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

    // ─── Document management ────────────────────────────────────────────

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
            let access: FileAccess | null = null;

            if (data.type === 'video') {
                const [video, videoAccess] = await Promise.all([
                    this.videoService.findOne(data.id),
                    this.videoService.findAccess(data.id),
                ]);
                storageUrl = video.video?.secure_url ?? video.video?.url ?? '';
                publicId = video.video?.public_id ?? '';
                access = videoAccess;
            } else if (data.type === 'document') {
                const [doc, docAccess] = await Promise.all([
                    this.documentService.findOne(data.id),
                    this.documentService.findAccess(data.id),
                ]);
                storageUrl = doc.storageUrl;
                publicId = doc.publicId ?? '';
                access = docAccess;
            } else {
                const [image, imageAccess] = await Promise.all([
                    this.imageService.findOne(data.id),
                    this.imageService.findAccess(data.id),
                ]);
                storageUrl = image.image?.original?.secure_url ?? image.image?.original?.url ?? '';
                publicId = image.image?.original?.public_id ?? '';
                access = imageAccess;
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
