/**
 * Single source of truth for file upload size and MIME constraints.
 *
 * Used by:
 *   - Gateway controllers (StreamingUploadInterceptor + assertMime)
 *   - Frontend client-side validation (assertUploadLimit)
 *   - UI components (<input accept=""> values)
 *
 * Add new upload kinds here; both server and client pick them up after
 * a `@asko/shared` rebuild.
 */

const MB = 1024 * 1024;

export interface UploadLimitDef {
    /** Hard cap in bytes. */
    maxBytes: number;
    /** Regex matching the MIME subtype (portion after `/`). */
    mime: RegExp;
    /** Human-readable list of allowed extensions for error messages. */
    allowedExts: string;
    /** Value for the HTML `<input accept="">` attribute. */
    accept: string;
}

export const UPLOAD_LIMITS = {
    avatar: {
        maxBytes: 5 * MB,
        mime: /(jpg|jpeg|png|webp)$/,
        allowedExts: 'JPG, PNG, WEBP',
        accept: 'image/jpeg,image/png,image/webp',
    },
    image: {
        maxBytes: 10 * MB,
        mime: /(jpg|jpeg|png|webp)$/,
        allowedExts: 'JPG, PNG, WEBP',
        accept: 'image/jpeg,image/png,image/webp',
    },
    video: {
        maxBytes: 100 * MB,
        mime: /(mp4|webm|mov|quicktime)$/,
        allowedExts: 'MP4, WEBM, MOV',
        accept: 'video/mp4,video/webm,video/quicktime,.mov',
    },
    document: {
        maxBytes: 20 * MB,
        mime: /(pdf|jpeg|jpg|png|webp|msword|wordprocessingml\.document|ms-excel|spreadsheetml\.sheet|plain|csv)$/i,
        allowedExts: 'PDF, DOC, DOCX, XLS, XLSX, CSV, TXT, JPG, PNG, WEBP',
        accept: '.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,image/jpeg,image/png,image/webp',
    },
} satisfies Record<string, UploadLimitDef>;

export type UploadKind = keyof typeof UPLOAD_LIMITS;
