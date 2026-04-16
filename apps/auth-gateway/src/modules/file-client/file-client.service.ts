import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { grpcStreamUpload, type StreamUploadOptions } from '@asko/gateway-common';
import type { Readable } from 'node:stream';

import type {
    FileServiceClient,
    ImageRecord,
    ImageResponse,
} from '@asko/proto';

/**
 * Minimal file client for auth-gateway — exposes only the avatar upload
 * that lives under /auth/users/:userId/avatar, via client-streaming gRPC.
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

    private parseImageResponse(res: ImageResponse) {
        return { image: this.parseRecord(res.image) };
    }

    async uploadUserAvatar(
        stream: Readable,
        originalname: string,
        mimetype: string,
        ownerId: string,
        opts: StreamUploadOptions,
    ) {
        const res = await grpcStreamUpload(
            (c$) => this.fileService.uploadUserAvatar(c$),
            stream,
            { originalname, mimetype, ownerId },
            opts,
        );
        return this.parseImageResponse(res);
    }
}
