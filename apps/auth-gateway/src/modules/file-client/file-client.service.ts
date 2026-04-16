import { Injectable } from '@nestjs/common';
import { FileClientService, grpcStreamUpload, type StreamUploadOptions } from '@asko/gateway-common';
import type { Readable } from 'node:stream';

/**
 * Auth-gateway-local file client: adds the avatar upload RPC on top of the
 * shared base. Avatar uploads belong to the auth domain (/auth/users/:id/avatar),
 * so the RPC method lives here rather than in gateway-common.
 */
@Injectable()
export class AuthFileClientService extends FileClientService {
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
