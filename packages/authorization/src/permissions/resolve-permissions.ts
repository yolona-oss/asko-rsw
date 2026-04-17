import { Role } from '@asko/shared';
import { Permission } from './permission.enum.js';
import { ROLE_PERMISSIONS } from './role-permission-map.js';

/**
 * Resolve the union of all permissions granted to a set of roles.
 * Called at request time by {@link PermissionGuard} using `JwtPayload.roles`.
 */
export function resolvePermissions(roles: string[]): ReadonlySet<Permission> {
    const result = new Set<Permission>();
    for (const role of roles) {
        const perms = ROLE_PERMISSIONS.get(role as Role);
        if (perms) {
            for (const p of perms) result.add(p);
        }
    }
    return result;
}

/** Check if a set of roles grants a specific permission. */
export function hasPermission(roles: string[], permission: Permission): boolean {
    for (const role of roles) {
        const perms = ROLE_PERMISSIONS.get(role as Role);
        if (perms?.has(permission)) return true;
    }
    return false;
}
