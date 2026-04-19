import type { RequesterContext } from '@asko/proto';
import type { JwtPayload } from '@asko/shared';

/**
 * Builds a RequesterContext for privacy-filtered gRPC calls.
 * Returns undefined for anonymous users.
 */
export function buildRequesterContext(user?: JwtPayload | { id: string; roles?: string[] }): RequesterContext | undefined {
    if (!user) return undefined;
    return {
        requesterId: 'sub' in user ? user.sub : user.id,
        requesterRoles: user.roles?.map(String) ?? [],
        isInternal: false,
    };
}
