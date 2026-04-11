import { Controller } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { ImageService } from 'services/image.service';
import { VideoService } from 'services/video.service';
import { ImageCleanupService } from 'services/image-cleanup.service';
import { DocumentService } from 'services/document.service';
import { AppError } from 'common/error';
import { ImageTypeEnum, VideoTypeEnum } from '@asko/shared';
import { Readable } from 'stream';
import type {
    UploadFileRequest,
    UploadWithOwnerRequest,
    CreateFromUrlRequest,
    ImageIdRequest,
    AttachImageRequest,
    FindAttachedRequest,
    CountAttachedRequest,
    ReorderImagesRequest,
    ReorderByIdsRequest,
    UploadVideoRequest,
    VideoIdRequest,
    AttachVideoRequest,
    GetFileAccessRequest,
    FileAccessResponse,
    UploadDocumentRequest,
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

function toMulterFile(fileData: UploadFileRequest['file'] | UploadWithOwnerRequest['file']): Express.Multer.File {
    const buffer = Buffer.from(fileData.buffer);
    return {
        fieldname: 'file',
        originalname: fileData.originalname,
        encoding: '7bit',
        mimetype: fileData.mimetype,
        size: buffer.length,
        buffer,
        stream: Readable.from(buffer),
        destination: '',
        filename: fileData.originalname,
        path: '',
    };
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
    ) {}

    // ─── Upload operations ──────────────────────────────────────────────

    @GrpcMethod('FileService', 'Upload')
    async upload(data: UploadFileRequest) {
        try {
            const file = toMulterFile(data.file);
            const image = await this.imageService.upload(file, data.alt || undefined, {
                creatorId: data.creatorId || undefined,
                visibility: data.visibility || undefined,
                conversationId: data.conversationId || undefined,
            });
            return { image: entityToRecord(image) };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('FileService', 'StreamUpload')
    async streamUpload(data: UploadFileRequest) {
        try {
            const file = toMulterFile(data.file);
            const image = await this.imageService.streamUpload(file, data.alt || undefined, {
                creatorId: data.creatorId || undefined,
                visibility: data.visibility || undefined,
                conversationId: data.conversationId || undefined,
            });
            return { image: entityToRecord(image) };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('FileService', 'UploadUserAvatar')
    async uploadUserAvatar(data: UploadWithOwnerRequest) {
        try {
            const file = toMulterFile(data.file);
            const image = await this.imageService.uploadUserAvatar(file, data.ownerId);
            return { image: entityToRecord(image) };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('FileService', 'UploadDeviceCatalogImage')
    async uploadDeviceCatalogImage(data: UploadWithOwnerRequest) {
        try {
            const file = toMulterFile(data.file);
            const image = await this.imageService.uploadDeviceImage(file, data.ownerId);
            return { image: entityToRecord(image) };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('FileService', 'UploadDeviceImage')
    async uploadDeviceImage(data: UploadWithOwnerRequest) {
        try {
            const file = toMulterFile(data.file);
            const image = await this.imageService.uploadDeviceImage(file, data.ownerId);
            return { image: entityToRecord(image) };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('FileService', 'UploadArticleImage')
    async uploadArticleImage(data: UploadWithOwnerRequest) {
        try {
            const file = toMulterFile(data.file);
            const image = await this.imageService.uploadArticleImage(file, data.ownerId);
            return { image: entityToRecord(image) };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('FileService', 'UploadRepairRequestImage')
    async uploadRepairRequestImage(data: UploadWithOwnerRequest) {
        try {
            const file = toMulterFile(data.file);
            const image = await this.imageService.uploadRepairRequestImage(file, data.ownerId);
            return { image: entityToRecord(image) };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('FileService', 'UploadReviewImage')
    async uploadReviewImage(data: UploadWithOwnerRequest) {
        try {
            const file = toMulterFile(data.file);
            const image = await this.imageService.uploadReviewImage(file, data.ownerId);
            return { image: entityToRecord(image) };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('FileService', 'UploadDevicePartImage')
    async uploadDevicePartImage(data: UploadWithOwnerRequest) {
        try {
            const file = toMulterFile(data.file);
            const image = await this.imageService.uploadDevicePartImage(file, data.ownerId);
            return { image: entityToRecord(image) };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('FileService', 'UploadBrokenPartImage')
    async uploadBrokenPartImage(data: UploadWithOwnerRequest) {
        try {
            const file = toMulterFile(data.file);
            const image = await this.imageService.uploadBrokenPartImage(file, data.ownerId);
            return { image: entityToRecord(image) };
        } catch (e) { throw toGrpcError(e); }
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

    @GrpcMethod('FileService', 'UploadVideo')
    async uploadVideo(data: UploadVideoRequest) {
        try {
            const file = toMulterFile(data.file);
            const video = await this.videoService.upload(
                file,
                data.creatorId || undefined,
                data.visibility || undefined,
                data.conversationId || undefined,
            );
            return { video: videoEntityToRecord(video) };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('FileService', 'UploadRepairRequestVideo')
    async uploadRepairRequestVideo(data: UploadWithOwnerRequest) {
        try {
            const file = toMulterFile(data.file);
            const video = await this.videoService.uploadRepairRequestVideo(file, data.ownerId);
            return { video: videoEntityToRecord(video) };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('FileService', 'UploadReviewVideo')
    async uploadReviewVideo(data: UploadWithOwnerRequest) {
        try {
            const file = toMulterFile(data.file);
            const video = await this.videoService.uploadReviewVideo(file, data.ownerId);
            return { video: videoEntityToRecord(video) };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('FileService', 'UploadDeviceVideo')
    async uploadDeviceVideo(data: UploadWithOwnerRequest) {
        try {
            const file = toMulterFile(data.file);
            const video = await this.videoService.uploadDeviceVideo(file, data.ownerId);
            return { video: videoEntityToRecord(video) };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('FileService', 'UploadArticleVideo')
    async uploadArticleVideo(data: UploadWithOwnerRequest) {
        try {
            const file = toMulterFile(data.file);
            const video = await this.videoService.uploadArticleVideo(file, data.ownerId);
            return { video: videoEntityToRecord(video) };
        } catch (e) { throw toGrpcError(e); }
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

    @GrpcMethod('FileService', 'UploadBrokenPartDocument')
    async uploadBrokenPartDocument(data: UploadWithOwnerRequest): Promise<DocumentResponse> {
        try {
            const file = toMulterFile(data.file);
            const doc = await this.documentService.uploadBrokenPartDocument(file, data.ownerId, {
                creatorId: data.creatorId || undefined,
                visibility: data.visibility || undefined,
                conversationId: data.conversationId || undefined,
            });
            return { document: documentToRecord(doc) };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('FileService', 'UploadRepairRequestDocument')
    async uploadRepairRequestDocument(data: UploadWithOwnerRequest): Promise<DocumentResponse> {
        try {
            const file = toMulterFile(data.file);
            const doc = await this.documentService.uploadRepairRequestDocument(file, data.ownerId, {
                creatorId: data.creatorId || undefined,
                visibility: data.visibility || undefined,
                conversationId: data.conversationId || undefined,
            });
            return { document: documentToRecord(doc) };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('FileService', 'UploadDocument')
    async uploadDocument(data: UploadDocumentRequest): Promise<DocumentResponse> {
        try {
            const file = toMulterFile(data.file);
            const doc = await this.documentService.upload(file, data.ownerType, data.ownerId, {
                creatorId: data.creatorId || undefined,
                visibility: data.visibility || undefined,
                conversationId: data.conversationId || undefined,
            });
            return { document: documentToRecord(doc) };
        } catch (e) { throw toGrpcError(e); }
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
