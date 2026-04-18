import { Injectable } from '@nestjs/common';
import { AppErrors, msg } from '@asko/shared';
import { isAdmin, isSelf, type Policy, type PolicyContext } from '@asko/authorization';

/**
 * Assert the user is acting on their own resource, or is an admin.
 * Reads the target user ID from `ctx.params[paramKey]` (default: `'userId'`).
 *
 * Replaces inline `isSelf(user, userId) && !isAdmin(user)` checks.
 */
@Injectable()
export class SelfOrAdminPolicy implements Policy {
    async authorize(ctx: PolicyContext): Promise<boolean> {
        const targetUserId = ctx.params.userId;
        if (!targetUserId) throw AppErrors.badRequest({ key: msg.access.userIdRequired });
        if (isSelf(ctx.user, targetUserId)) return true;
        if (isAdmin(ctx.user)) return true;
        throw AppErrors.forbidden({ key: msg.access.noAccessToOtherUser });
    }
}
