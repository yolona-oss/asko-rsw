import * as path from 'path';

/**
 * Throws if the resolved path escapes `root`.
 */
export function safePath(root: string, ...segments: string[]): string {
    const resolvedRoot = path.resolve(root);
    const resolved = path.resolve(root, ...segments);
    if (resolved !== resolvedRoot && !resolved.startsWith(resolvedRoot + path.sep)) {
        throw new Error('Path traversal blocked: resolved path escapes storage root');
    }
    return resolved;
}
