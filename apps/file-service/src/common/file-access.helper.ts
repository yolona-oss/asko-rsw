import { EntityManager } from '@mikro-orm/postgresql';
import { FileAccess } from 'common/file-access.entity';
import {
    AccessParams,
    FileKind,
    hasAccessParams,
} from './file-access.types';

// Re-export the pure surface so consumers can import everything from
// `common/file-access.helper` as before.
export type { AccessParams, AccessParamsInput, FileKind } from './file-access.types';
export { toAccessParams, hasAccessParams } from './file-access.types';

/**
 * Insert a `FileAccess` row if any field is set; no-op otherwise.
 * Centralizes the persist+flush that previously lived as
 * `image.service.createFileAccess`, `document.service.persistAccess`,
 * and an inline block in `video.service.uploadStreamGeneric`.
 */
export async function persistFileAccess(
    em: EntityManager,
    fileId: string,
    fileType: FileKind,
    params?: AccessParams,
): Promise<void> {
    if (!hasAccessParams(params)) return;
    const access = new FileAccess();
    access.fileId = fileId;
    access.fileType = fileType;
    if (params!.visibility) access.visibility = params!.visibility;
    if (params!.creatorId) access.creatorId = params!.creatorId;
    if (params!.conversationId) access.conversationId = params!.conversationId;
    em.persist(access);
    await em.flush();
}
