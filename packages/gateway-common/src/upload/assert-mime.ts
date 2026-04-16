import { AppErrors } from '@asko/shared';

/**
 * Reject the request before any bytes flow through the streaming pipeline
 * when the uploaded file's mime type does not match the allowed pattern.
 */
export function assertMime(received: string, allowed: RegExp): void {
    if (!allowed.test(received)) {
        throw AppErrors.badRequest('Unsupported mime type');
    }
}
