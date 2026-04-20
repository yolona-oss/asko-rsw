import { AppErrors, AccessTokenPayload, STAFF_ROLES, ADMIN_ROLES, Role } from '@asko/shared';

const STAFF_ROLE_SET: ReadonlySet<Role> = new Set(STAFF_ROLES);
const ADMIN_ROLE_SET: ReadonlySet<Role> = new Set(ADMIN_ROLES);

export function isStaff(user: AccessTokenPayload): boolean {
    return (user.roles ?? []).some((r) => STAFF_ROLE_SET.has(r));
}

export function isAdmin(user: AccessTokenPayload): boolean {
    return (user.roles ?? []).some((r) => ADMIN_ROLE_SET.has(r));
}

export function isSuperAdmin(user: AccessTokenPayload): boolean {
    return (user.roles ?? []).includes(Role.SUPER_ADMIN);
}

export function isSelf(user: AccessTokenPayload, targetUserId: string): boolean {
    return user.sub === targetUserId;
}

/**
 * Staff (admin/manager/dealer/super_admin) may act on any target user.
 * Non-staff callers may only act on their own userId — otherwise throws 403.
 */
export function assertSelfOrStaff(user: AccessTokenPayload, targetUserId: string, message?: string): void {
    if (isStaff(user)) return;
    if (user.sub !== targetUserId) {
        throw AppErrors.forbidden(message ?? 'Нет доступа к данным другого пользователя');
    }
}
