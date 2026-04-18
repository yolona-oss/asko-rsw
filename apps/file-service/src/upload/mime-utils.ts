import * as path from 'path';

export type MediaKind = 'image' | 'video' | 'document';

/** Classify a MIME type into the three media buckets. */
export function classifyMime(mimetype: string): MediaKind {
    if (mimetype.startsWith('image/')) return 'image';
    if (mimetype.startsWith('video/')) return 'video';
    return 'document';
}

/**
 * Allowed document MIME types. Used for server-side validation of document
 * uploads — images and videos are validated at the gateway level via
 * UPLOAD_LIMITS and don't need re-checking here.
 */
export const ALLOWED_DOCUMENT_MIMES = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv',
] as const;

type AllowedDocumentMime = (typeof ALLOWED_DOCUMENT_MIMES)[number];

export function isAllowedDocumentMime(mimeType: string): boolean {
    return ALLOWED_DOCUMENT_MIMES.includes(mimeType as AllowedDocumentMime);
}

/**
 * Resolve a file extension from a MIME type. Covers image, video, and
 * document MIME types in a single map (merged from the previously separate
 * LocalStorageService.extFromMime and DocumentService.extFromMime).
 */
export function extFromMime(mimeType: string, originalName?: string): string {
    const map: Record<string, string> = {
        // images
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/webp': 'webp',
        'image/gif': 'gif',
        // videos
        'video/mp4': 'mp4',
        'video/webm': 'webm',
        'video/quicktime': 'mov',
        // documents
        'application/pdf': 'pdf',
        'application/msword': 'doc',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
        'application/vnd.ms-excel': 'xls',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
        'text/plain': 'txt',
        'text/csv': 'csv',
    };

    const ext = map[mimeType];
    if (ext) return ext;

    if (originalName) {
        const parsed = path.extname(originalName).replace('.', '');
        if (parsed) return parsed;
    }

    return 'bin';
}
