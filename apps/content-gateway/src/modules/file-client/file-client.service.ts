import { Injectable } from '@nestjs/common';
import { FileClientService, grpcStreamUpload, type StreamUploadOptions } from '@asko/gateway-common';
import type { Readable } from 'node:stream';

/**
 * Content-gateway-local file client: adds article media uploads on top of the
 * shared base. Article image/video uploads belong to the content domain, so
 * their RPC methods live here rather than in gateway-common.
 */
@Injectable()
export class ContentFileClientService extends FileClientService {
    async uploadArticleImage(
        stream: Readable, originalname: string, mimetype: string, ownerId: string, opts: StreamUploadOptions,
    ) {
        const res = await grpcStreamUpload(
            (c$) => this.fileService.uploadArticleImage(c$),
            stream, { originalname, mimetype, ownerId }, opts,
        );
        return this.parseImageResponse(res);
    }

    async uploadArticleVideo(
        stream: Readable, originalname: string, mimetype: string, ownerId: string, opts: StreamUploadOptions,
    ) {
        const res = await grpcStreamUpload(
            (c$) => this.fileService.uploadArticleVideo(c$),
            stream, { originalname, mimetype, ownerId }, opts,
        );
        return this.parseVideoResponse(res);
    }
}
