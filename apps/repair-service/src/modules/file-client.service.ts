import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { lastValueFrom, Observable } from 'rxjs';

import type {
    FileServiceClient,
    ImageResponse,
    ImageListResponse,
    CountResponse,
} from '@asko/proto';

async function grpcCall<T>(observable: Observable<T>): Promise<T> {
    return lastValueFrom(observable);
}

@Injectable()
export class FileClientService implements OnModuleInit {
    private fileService!: FileServiceClient;

    constructor(
        @Inject('FILE_PACKAGE') private readonly client: ClientGrpc,
    ) {}

    onModuleInit() {
        this.fileService = this.client.getService<FileServiceClient>('FileService');
    }

    // ─── Management operations ──────────────────────────────────────────

    findAttachedImages(ownerType: string, ownerId: string): Promise<ImageListResponse> {
        return grpcCall(this.fileService.findAttachedImages({ ownerType, ownerId }));
    }

    countAttached(ownerId: string, ownerType: string): Promise<CountResponse> {
        return grpcCall(this.fileService.countAttached({ ownerId, ownerType }));
    }

    remove(id: string): Promise<void> {
        return grpcCall(this.fileService.remove({ id })).then(() => undefined);
    }

    attachImage(imageId: string, ownerType: string, ownerId: string): Promise<ImageResponse> {
        return grpcCall(this.fileService.attachImage({ imageId, ownerType, ownerId }));
    }

    unattachImage(imageId: string): Promise<void> {
        return grpcCall(this.fileService.unattachImage({ id: imageId })).then(() => undefined);
    }
}
