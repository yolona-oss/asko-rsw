import { AppErrors, JwtPayload, STAFF_ROLES } from '@asko/shared';

const STAFF_ROLE_SET: ReadonlySet<string> = new Set(STAFF_ROLES as readonly string[]);

export function isStaff(user: JwtPayload): boolean {
    return (user.roles ?? []).some((r) => STAFF_ROLE_SET.has(r));
}

export function isSelf(user: JwtPayload, targetUserId: string): boolean {
    return user.sub === targetUserId;
}

/**
 * Staff (admin/manager/dealer/super_admin) may act on any target user.
 * Non-staff callers may only act on their own userId — otherwise throws 403.
 */
export function assertSelfOrStaff(user: JwtPayload, targetUserId: string, message?: string): void {
    if (isStaff(user)) return;
    if (user.sub !== targetUserId) {
        throw AppErrors.forbidden(message ?? 'Нет доступа к данным другого пользователя');
    }
}
