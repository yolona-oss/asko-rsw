/**
 * Client-side upload validation — re-exports the canonical limits from
 * `@asko/shared/client` and adds browser-only helpers (File/Blob size +
 * MIME checks).
 */

import { UPLOAD_LIMITS } from '@asko/shared/client';
import type { UploadKind } from '@asko/shared/client';

export { UPLOAD_LIMITS };
export type { UploadLimitDef, UploadKind } from '@asko/shared/client';

const MB = 1024 * 1024;

/**
 * Throws with a Russian user-facing message when the file violates the
 * size or MIME constraints for the given upload kind. Message shape matches
 * server error responses so UIs can render consistently.
 */
export function assertUploadLimit(file: File | Blob, kind: UploadKind): void {
    const limit = UPLOAD_LIMITS[kind];
    const size = file.size;
    if (size > limit.maxBytes) {
        const mb = (limit.maxBytes / MB).toFixed(0);
        throw new UploadValidationError(
            `Файл слишком большой. Максимум: ${mb} МБ`,
        );
    }
    // MIME on `File` is `image/jpeg` — we match the subtype portion.
    const mime = 'type' in file ? file.type : '';
    if (mime && !limit.mime.test(mime)) {
        throw new UploadValidationError(
            `Неподдерживаемый тип файла. Разрешены: ${limit.allowedExts}`,
        );
    }
}

/**
 * Thrown by `assertUploadLimit` and caught by upload helpers. Distinct
 * class so components can render "client-side invalid" differently from
 * network/server errors.
 */
export class UploadValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'UploadValidationError';
    }
}
