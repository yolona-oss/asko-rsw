import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { lastValueFrom, Observable } from 'rxjs';
import type { FileServiceClient, ImageResponse, ImageListResponse, EmptyFileResponse } from '@asko/proto';

async function grpcCall<T>(observable: Observable<T>): Promise<T> {
    return lastValueFrom(observable);
}

@Injectable()
export class FileClientService implements OnModuleInit {
    private fileService!: FileServiceClient;

    constructor(@Inject('FILE_PACKAGE') private readonly client: ClientGrpc) {}

    onModuleInit() {
        this.fileService = this.client.getService<FileServiceClient>('FileService');
    }

    private toFileData(file: { buffer: Buffer; originalname: string; mimetype: string }) {
        return { buffer: file.buffer, originalname: file.originalname, mimetype: file.mimetype };
    }

    uploadReviewImage(file: { buffer: Buffer; originalname: string; mimetype: string }, ownerId: string): Promise<ImageResponse> {
        return grpcCall(this.fileService.uploadDeviceImage({ file: this.toFileData(file), ownerId }));
    }

    findAttachedImages(ownerType: string, ownerId: string): Promise<ImageListResponse> {
        return grpcCall(this.fileService.findAttachedImages({ ownerType, ownerId }));
    }

    remove(id: string): Promise<EmptyFileResponse> {
        return grpcCall(this.fileService.remove({ id }));
    }
}
