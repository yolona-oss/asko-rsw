import { Injectable } from '@nestjs/common';
import { AppErrors, msg } from '@asko/shared';
import { isStaff, type Policy, type PolicyContext } from '@asko/authorization';

/**
 * Assert that the user is acting on their own schedule entry, or is staff.
 *
 * For create endpoints, reads `userId` from `ctx.body`.
 * For endpoints with `:userId` param, reads from `ctx.params.userId`.
 *
 * Replaces inline `assertSelfOrStaff(user, dto.userId, ...)` calls
 * in `wschedule.controller.ts`.
 */
@Injectable()
export class ScheduleSelfOrStaffPolicy implements Policy {
    async authorize(ctx: PolicyContext): Promise<boolean> {
        if (isStaff(ctx.user)) return true;

        // Try param first (e.g. GET/PUT/DELETE pattern/:userId), then body (create DTOs)
        const targetUserId = ctx.params.userId ?? (ctx.body as any)?.userId;
        if (!targetUserId) {
            throw AppErrors.badRequest({ key: msg.access.userIdRequired });
        }
        if (ctx.user.sub !== targetUserId) {
            throw AppErrors.forbidden({ key: msg.access.noAccessToSchedule });
        }
        return true;
    }
}
