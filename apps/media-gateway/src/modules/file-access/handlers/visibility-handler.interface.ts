import type { JwtPayload, FileVisibility } from '@asko/shared';
import type { FileAccessResponse } from '@asko/proto';

/**
 * Strategy interface for file-visibility access control.
 * One handler per {@link FileVisibility} variant. Registered as a multi-provider
 * in `FileAccessModule` and looked up by `FileAccessService` at request time.
 */
export interface FileVisibilityHandler {
    readonly visibility: FileVisibility;
    authorize(access: FileAccessResponse, user?: JwtPayload): Promise<void>;
}

export const FILE_VISIBILITY_HANDLERS = Symbol('FILE_VISIBILITY_HANDLERS');
