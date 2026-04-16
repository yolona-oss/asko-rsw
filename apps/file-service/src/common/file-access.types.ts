import { FileVisibility } from '@asko/shared';

/** Values accepted by the `file_access.file_type` column. */
export type FileKind = 'image' | 'video' | 'document';

/**
 * Access-control fields persisted to the `file_access` table alongside
 * an uploaded file. One type, used by every upload service.
 */
export interface AccessParams {
    creatorId?: string;
    visibility?: FileVisibility;
    conversationId?: string;
}

/**
 * Raw shape as delivered over gRPC (subset of `UploadStart`). Proto
 * only knows strings; callers narrow to `AccessParams` via
 * {@link toAccessParams} before handing it to a service.
 */
export interface AccessParamsInput {
    creatorId?: string;
    visibility?: string;
    conversationId?: string;
}

/**
 * Narrow a raw proto payload into a typed `AccessParams`. Unknown
 * visibility strings drop silently — the enum is a closed set and a
 * mystery value shouldn't round-trip to the DB.
 *
 * Pure function; no entity imports → safe to unit-test in isolation.
 */
export function toAccessParams(raw: AccessParamsInput): AccessParams {
    return {
        creatorId: raw.creatorId || undefined,
        visibility: parseVisibility(raw.visibility),
        conversationId: raw.conversationId || undefined,
    };
}

function parseVisibility(raw?: string): FileVisibility | undefined {
    if (!raw) return undefined;
    return (Object.values(FileVisibility) as string[]).includes(raw)
        ? (raw as FileVisibility)
        : undefined;
}

/** True iff any field is set — gates the FileAccess insert. */
export function hasAccessParams(params?: AccessParams): boolean {
    return !!(params?.creatorId || params?.visibility || params?.conversationId);
}
