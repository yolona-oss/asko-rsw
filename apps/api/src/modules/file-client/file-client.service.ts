import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { grpcCall } from 'common/grpc';
import { ImageTypeEnum } from '@asko/shared';

import type {
    FileServiceClient,
    ImageRecord,
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

    async upload(file: Express.Multer.File, alt?: string) {
        const res = await grpcCall(this.fileService.upload({
            file: this.toFileData(file),
            alt: alt ?? '',
        }));
        return this.parseImageResponse(res);
    }

    async streamUpload(file: Express.Multer.File, alt?: string) {
        const res = await grpcCall(this.fileService.streamUpload({
            file: this.toFileData(file),
            alt: alt ?? '',
        }));
        return this.parseImageResponse(res);
    }

    async uploadUserAvatar(file: Express.Multer.File, ownerId: string) {
        const res = await grpcCall(this.fileService.uploadUserAvatar({
            file: this.toFileData(file),
            ownerId,
        }));
        return this.parseImageResponse(res);
    }

    async uploadProductImage(file: Express.Multer.File, ownerId: string) {
        const res = await grpcCall(this.fileService.uploadProductImage({
            file: this.toFileData(file),
            ownerId,
        }));
        return this.parseImageResponse(res);
    }

    async uploadDeviceImage(file: Express.Multer.File, ownerId: string) {
        const res = await grpcCall(this.fileService.uploadDeviceImage({
            file: this.toFileData(file),
            ownerId,
        }));
        return this.parseImageResponse(res);
    }

    async uploadArticleImage(file: Express.Multer.File, ownerId: string) {
        const res = await grpcCall(this.fileService.uploadArticleImage({
            file: this.toFileData(file),
            ownerId,
        }));
        return this.parseImageResponse(res);
    }

    async uploadRepairRequestImage(file: Express.Multer.File, ownerId: string) {
        const res = await grpcCall(this.fileService.uploadRepairRequestImage({
            file: this.toFileData(file),
            ownerId,
        }));
        return this.parseImageResponse(res);
    }

    async uploadReviewImage(file: Express.Multer.File, ownerId: string) {
        const res = await grpcCall(this.fileService.uploadReviewImage({
            file: this.toFileData(file),
            ownerId,
        }));
        return this.parseImageResponse(res);
    }

    async uploadDevicePartImage(file: Express.Multer.File, ownerId: string) {
        const res = await grpcCall(this.fileService.uploadDevicePartImage({
            file: this.toFileData(file),
            ownerId,
        }));
        return this.parseImageResponse(res);
    }

    async uploadBrokenPartImage(file: Express.Multer.File, ownerId: string) {
        const res = await grpcCall(this.fileService.uploadBrokenPartImage({
            file: this.toFileData(file),
            ownerId,
        }));
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

    // ─── Reorder operations ─────────────────────────────────────────────

    reorderImages(ownerType: ImageTypeEnum, ownerId: string, schema: { id: string; order: number }[]): Promise<EmptyFileResponse> {
        return grpcCall(this.fileService.reorderImages({ ownerType, ownerId, schema }));
    }

    async reorderByIds(ownerType: ImageTypeEnum, ownerId: string, imageIds: string[]) {
        const res = await grpcCall(this.fileService.reorderByIds({ ownerType, ownerId, imageIds }));
        return this.parseImageListResponse(res);
    }
}
