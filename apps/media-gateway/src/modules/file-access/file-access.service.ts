import { ForbiddenException, Inject, Injectable, NotFoundException, Optional } from '@nestjs/common';
import { JwtPayload } from '@asko/shared';
import { FileClientService } from '@asko/gateway-common';
import { MetricsService } from '@asko/observability';
import type { FileAccessResponse } from '@asko/proto';
import { FILE_VISIBILITY_HANDLERS, type FileVisibilityHandler } from './handlers/visibility-handler.interface';

/**
 * Access policy for file-serving requests on media-gateway. Dispatches to
 * per-visibility handler strategies instead of a switch/case.
 *
 * Emits `access_assert_total{assertion, outcome}` when MetricsService is
 * registered in the host gateway.
 */
@Injectable()
export class FileAccessService {
    private readonly handlerMap: Map<string, FileVisibilityHandler>;

    constructor(
        private readonly fileClient: FileClientService,
        @Inject(FILE_VISIBILITY_HANDLERS) handlers: FileVisibilityHandler[],
        @Optional() private readonly metrics?: MetricsService,
    ) {
        this.handlerMap = new Map(handlers.map((h) => [h.visibility, h]));
    }

    private record(assertion: string, outcome: 'allow' | 'deny' | 'not_found' | 'error'): void {
        this.metrics?.accessAssertTotal.inc({ assertion, outcome });
    }

    /**
     * Load the FileAccess record for `id` of `type` and throw if the JWT
     * user isn't permitted to read it. Returns the record on success so
     * the controller can serve the bytes without a second fetch.
     */
    async assertReadable(id: string, type: string, user?: JwtPayload): Promise<FileAccessResponse> {
        let access: FileAccessResponse;
        try {
            access = await this.fileClient.getFileAccess(id, type);
        } catch {
            this.record('file_access.load', 'not_found');
            throw new NotFoundException('File not found');
        }

        const visibility = access.visibility || 'public';
        const assertion = `file_access.${visibility}`;

        if (visibility === 'public') {
            this.record(assertion, 'allow');
            return access;
        }

        if (!user) {
            this.record(assertion, 'deny');
            throw new ForbiddenException('Authentication required');
        }

        const handler = this.handlerMap.get(visibility);
        if (!handler) {
            this.record(assertion, 'deny');
            throw new ForbiddenException('Access denied');
        }

        try {
            await handler.authorize(access, user);
            this.record(assertion, 'allow');
            return access;
        } catch (e) {
            if (e instanceof ForbiddenException) this.record(assertion, 'deny');
            else this.record(assertion, 'error');
            throw e;
        }
    }
}
