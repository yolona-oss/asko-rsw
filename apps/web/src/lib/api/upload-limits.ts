/**
 * Client-side upload limits — mirrors the server-side `MaxFileSizeValidator`
 * and MIME patterns enforced by `StreamingUploadInterceptor` + `assertMime`
 * on each gateway. Forms validate before POST so users get an inline error
 * instead of a round-trip 400.
 *
 * Keep in sync with:
 *   - apps/auth-gateway/src/modules/user/user.controller.ts (avatar)
 *   - apps/repair-gateway/src/modules/file-upload/controllers/*.ts
 *   - apps/content-gateway/src/modules/file-upload/controllers/*.ts
 *   - apps/media-gateway/src/modules/file-upload/controllers/*.ts
 */

const MB = 1024 * 1024;

export interface UploadLimit {
    /** Human-readable kind, used in error messages. */
    kind: 'avatar' | 'image' | 'video' | 'document';
    maxBytes: number;
    /** Regex of allowed MIME subtypes (after the `/`). */
    mime: RegExp;
    /** Pretty list of allowed extensions for error messages. */
    allowedExts: string;
}

export const UPLOAD_LIMITS = {
    avatar: {
        kind: 'avatar',
        maxBytes: 5 * MB,
        mime: /(jpg|jpeg|png|webp)$/,
        allowedExts: 'JPG, PNG, WEBP',
    },
    image: {
        kind: 'image',
        maxBytes: 10 * MB,
        mime: /(jpg|jpeg|png|webp)$/,
        allowedExts: 'JPG, PNG, WEBP',
    },
    video: {
        kind: 'video',
        maxBytes: 100 * MB,
        mime: /(mp4|webm|mov|quicktime)$/,
        allowedExts: 'MP4, WEBM, MOV',
    },
    document: {
        kind: 'document',
        maxBytes: 20 * MB,
        mime: /(pdf|jpeg|jpg|png|webp|msword|wordprocessingml\.document|ms-excel|spreadsheetml\.sheet|plain|csv)$/i,
        allowedExts: 'PDF, DOC, DOCX, XLS, XLSX, CSV, TXT, JPG, PNG, WEBP',
    },
} as const satisfies Record<string, UploadLimit>;

export type UploadKind = keyof typeof UPLOAD_LIMITS;

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
