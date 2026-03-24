import { Controller } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { ImageService } from 'services/image.service';
import { AppError } from 'common/error';
import { ImageTypeEnum } from '@asko/shared';
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
} from '@asko/proto';
import type { Image } from 'entities/image.entity';

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

@Controller()
export class FileGrpcController {
    constructor(private readonly imageService: ImageService) {}

    // ─── Upload operations ──────────────────────────────────────────────

    @GrpcMethod('FileService', 'Upload')
    async upload(data: UploadFileRequest) {
        try {
            const file = toMulterFile(data.file);
            const image = await this.imageService.upload(file, data.alt || undefined);
            return { image: entityToRecord(image) };
        } catch (e) { throw toGrpcError(e); }
    }

    @GrpcMethod('FileService', 'StreamUpload')
    async streamUpload(data: UploadFileRequest) {
        try {
            const file = toMulterFile(data.file);
            const image = await this.imageService.streamUpload(file, data.alt || undefined);
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

    @GrpcMethod('FileService', 'UploadProductImage')
    async uploadProductImage(data: UploadWithOwnerRequest) {
        try {
            const file = toMulterFile(data.file);
            const image = await this.imageService.uploadProductImage(file, data.ownerId);
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
}
