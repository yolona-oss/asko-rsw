import type { RequesterContext } from '@asko/proto';
import type { AccessTokenPayload } from '@asko/shared';

/**
 * Builds a RequesterContext for privacy-filtered gRPC calls.
 * Returns undefined for anonymous users.
 */
export function buildRequesterContext(user?: AccessTokenPayload): RequesterContext | undefined {
    if (!user) return undefined;
    return {
        requesterId: user.sub,
        requesterRoles: user.roles?.map(String) ?? [],
        isInternal: false,
    };
}
