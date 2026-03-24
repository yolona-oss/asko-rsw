import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { grpcCall } from 'common/grpc';
import { ImageTypeEnum } from '@asko/shared';

import type {
    FileServiceClient,
    ImageResponse,
    ImageListResponse,
    CountResponse,
    EmptyFileResponse,
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

    private toFileData(file: Express.Multer.File) {
        return {
            buffer: file.buffer,
            originalname: file.originalname,
            mimetype: file.mimetype,
        };
    }

    // ─── Upload operations ──────────────────────────────────────────────

    upload(file: Express.Multer.File, alt?: string): Promise<ImageResponse> {
        return grpcCall(this.fileService.upload({
            file: this.toFileData(file),
            alt: alt ?? '',
        }));
    }

    streamUpload(file: Express.Multer.File, alt?: string): Promise<ImageResponse> {
        return grpcCall(this.fileService.streamUpload({
            file: this.toFileData(file),
            alt: alt ?? '',
        }));
    }

    uploadUserAvatar(file: Express.Multer.File, ownerId: string): Promise<ImageResponse> {
        return grpcCall(this.fileService.uploadUserAvatar({
            file: this.toFileData(file),
            ownerId,
        }));
    }

    uploadProductImage(file: Express.Multer.File, ownerId: string): Promise<ImageResponse> {
        return grpcCall(this.fileService.uploadProductImage({
            file: this.toFileData(file),
            ownerId,
        }));
    }

    uploadDeviceImage(file: Express.Multer.File, ownerId: string): Promise<ImageResponse> {
        return grpcCall(this.fileService.uploadDeviceImage({
            file: this.toFileData(file),
            ownerId,
        }));
    }

    uploadArticleImage(file: Express.Multer.File, ownerId: string): Promise<ImageResponse> {
        return grpcCall(this.fileService.uploadArticleImage({
            file: this.toFileData(file),
            ownerId,
        }));
    }

    uploadRepairRequestImage(file: Express.Multer.File, ownerId: string): Promise<ImageResponse> {
        return grpcCall(this.fileService.uploadRepairRequestImage({
            file: this.toFileData(file),
            ownerId,
        }));
    }

    uploadReviewImage(file: Express.Multer.File, ownerId: string): Promise<ImageResponse> {
        return grpcCall(this.fileService.uploadReviewImage({
            file: this.toFileData(file),
            ownerId,
        }));
    }

    uploadDevicePartImage(file: Express.Multer.File, ownerId: string): Promise<ImageResponse> {
        return grpcCall(this.fileService.uploadDevicePartImage({
            file: this.toFileData(file),
            ownerId,
        }));
    }

    uploadBrokenPartImage(file: Express.Multer.File, ownerId: string): Promise<ImageResponse> {
        return grpcCall(this.fileService.uploadBrokenPartImage({
            file: this.toFileData(file),
            ownerId,
        }));
    }

    // ─── URL operations ─────────────────────────────────────────────────

    createFromUrl(url: string, ownerType?: ImageTypeEnum, ownerId?: string, order?: number): Promise<ImageResponse> {
        return grpcCall(this.fileService.createFromUrl({
            url,
            ownerType: ownerType ?? '',
            ownerId: ownerId ?? '',
            order: order ?? 0,
        }));
    }

    // ─── Management operations ──────────────────────────────────────────

    remove(id: string): Promise<EmptyFileResponse> {
        return grpcCall(this.fileService.remove({ id }));
    }

    unattachImage(imageId: string): Promise<EmptyFileResponse> {
        return grpcCall(this.fileService.unattachImage({ id: imageId }));
    }

    attachImage(imageId: string, dto: { ownerType: ImageTypeEnum; ownerId: string }): Promise<ImageResponse> {
        return grpcCall(this.fileService.attachImage({
            imageId,
            ownerType: dto.ownerType,
            ownerId: dto.ownerId,
        }));
    }

    findAttachedImages(ownerType: ImageTypeEnum, ownerId: string): Promise<ImageListResponse> {
        return grpcCall(this.fileService.findAttachedImages({ ownerType, ownerId }));
    }

    countAttached(ownerId: string, ownerType: ImageTypeEnum): Promise<CountResponse> {
        return grpcCall(this.fileService.countAttached({ ownerId, ownerType }));
    }

    // ─── Reorder operations ─────────────────────────────────────────────

    reorderImages(ownerType: ImageTypeEnum, ownerId: string, schema: { id: string; order: number }[]): Promise<EmptyFileResponse> {
        return grpcCall(this.fileService.reorderImages({ ownerType, ownerId, schema }));
    }

    reorderByIds(ownerType: ImageTypeEnum, ownerId: string, imageIds: string[]): Promise<ImageListResponse> {
        return grpcCall(this.fileService.reorderByIds({ ownerType, ownerId, imageIds }));
    }
}
