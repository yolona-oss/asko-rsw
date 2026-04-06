import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { grpcCall } from '@asko/gateway-common';
import { ImageTypeEnum } from '@asko/shared';

import type {
    FileServiceClient,
    ImageRecord,
    ImageListResponse,
    EmptyFileResponse,
} from '@asko/proto';

/**
 * Minimal file client for content-gateway — only exposes operations
 * needed by the articles controller (image listing, reordering, removal).
 */
@Injectable()
export class FileClientService implements OnModuleInit {
    private fileService!: FileServiceClient;

    constructor(
        @Inject('FILE_PACKAGE') private readonly client: ClientGrpc,
    ) {}

    onModuleInit() {
        this.fileService = this.client.getService<FileServiceClient>('FileService');
    }

    private parseRecord(record: ImageRecord): ImageRecord & { imageJson: any } {
        try {
            return { ...record, imageJson: JSON.parse(record.imageJson) };
        } catch {
            return record as any;
        }
    }

    private parseImageListResponse(res: ImageListResponse) {
        return { images: (res.images ?? []).map((r) => this.parseRecord(r)) };
    }

    async findAttachedImages(ownerType: ImageTypeEnum, ownerId: string) {
        const res = await grpcCall(this.fileService.findAttachedImages({ ownerType, ownerId }));
        return this.parseImageListResponse(res);
    }

    remove(id: string): Promise<EmptyFileResponse> {
        return grpcCall(this.fileService.remove({ id }));
    }

    async reorderByIds(ownerType: ImageTypeEnum, ownerId: string, imageIds: string[]) {
        const res = await grpcCall(this.fileService.reorderByIds({ ownerType, ownerId, imageIds }));
        return this.parseImageListResponse(res);
    }
}
