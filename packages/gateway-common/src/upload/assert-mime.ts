import { AppErrors, msg } from '@asko/shared';

/**
 * Reject the request before any bytes flow through the streaming pipeline
 * when the uploaded file's mime type does not match the allowed pattern.
 */
export function assertMime(received: string, allowed: RegExp): void {
    if (!allowed.test(received)) {
        throw AppErrors.badRequest({ key: msg.file.unsupportedMimeType, params: { mime: received } });
    }
}
