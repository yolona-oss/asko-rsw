import type { UserResponse } from '@asko/proto';
import type { PrivacyRules } from '@asko/shared';
import { resolveVisibleFields, ALL_PRIVACY_FIELDS, type PrivacyEvalContext } from '@asko/shared';

interface RequesterCtx {
    requesterId?: string;
    requesterRoles?: string[];
    isInternal?: boolean;
}

/**
 * Strips fields from a UserResponse that the requester is not allowed to see
 * based on the target user's privacy rules.
 *
 * Returns a new object — the original is not mutated.
 */
export function applyPrivacyFilter(
    response: UserResponse,
    privacyRules: PrivacyRules | null | undefined,
    ctx: RequesterCtx,
): UserResponse {
    const evalCtx: PrivacyEvalContext = {
        targetUserId: response.id,
        requesterId: ctx.requesterId,
        requesterRoles: ctx.requesterRoles,
        isInternal: ctx.isInternal,
    };

    const visible = resolveVisibleFields(privacyRules, evalCtx);

    let allVisible = true;
    for (const k of ALL_PRIVACY_FIELDS) {
        if (!visible.has(k)) { allVisible = false; break; }
    }
    if (allVisible) return response;

    return {
        id: response.id,
        firstName: visible.has('firstName') ? response.firstName : '',
        lastName: visible.has('lastName') ? response.lastName : '',
        middleName: visible.has('middleName') ? response.middleName : '',
        email: visible.has('email') ? response.email : '',
        phone: visible.has('phone') ? response.phone : '',
        googleId: visible.has('googleId') ? response.googleId : '',
        emailVerified: visible.has('emailVerified') ? response.emailVerified : false,
        phoneVerified: visible.has('phoneVerified') ? response.phoneVerified : false,
        isActive: visible.has('isActive') ? response.isActive : true,
        providers: visible.has('providers') ? response.providers : [],
        roles: visible.has('roles') ? response.roles : [],
        createdAt: visible.has('createdAt') ? response.createdAt : '',
        updatedAt: visible.has('updatedAt') ? response.updatedAt : '',
        settings: visible.has('settings') ? response.settings : undefined,
    };
}
