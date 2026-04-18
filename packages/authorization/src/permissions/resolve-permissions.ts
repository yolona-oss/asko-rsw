import { Role } from '@asko/shared';
import { Permission } from './permission.enum.js';
import { ROLE_PERMISSIONS } from './role-permission-map.js';

const cache = new Map<string, ReadonlySet<Permission>>();

/**
 * Resolve the union of all permissions granted to a set of roles.
 * Called at request time by {@link PermissionGuard} using `JwtPayload.roles`.
 * Results are memoized by sorted role set (only ~6 distinct roles).
 */
export function resolvePermissions(roles: string[]): ReadonlySet<Permission> {
    const key = roles.slice().sort().join(',');
    const cached = cache.get(key);
    if (cached) return cached;

    const result = new Set<Permission>();
    for (const role of roles) {
        const perms = ROLE_PERMISSIONS.get(role as Role);
        if (perms) {
            for (const p of perms) result.add(p);
        }
    }
    cache.set(key, result);
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
