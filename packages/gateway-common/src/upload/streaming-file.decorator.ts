import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AppErrors } from '@asko/shared';
import type { StreamingUploadPayload } from './streaming-upload.interceptor';

/**
 * Extracts the `StreamingUploadPayload` that `StreamingUploadInterceptor`
 * attached to the request. Throws if the interceptor didn't run.
 */
export const StreamingFile = createParamDecorator<void>(
    (_: unknown, ctx: ExecutionContext): StreamingUploadPayload => {
        const req = ctx.switchToHttp().getRequest();
        const payload = req.streamingUpload as StreamingUploadPayload | undefined;
        if (!payload) {
            throw AppErrors.internalError('StreamingUploadInterceptor did not attach a payload');
        }
        return payload;
    },
);

export type { StreamingUploadPayload } from './streaming-upload.interceptor';
