import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { Permission } from './permission.enum.js';
import { PermissionGuard } from './permission.guard.js';

export const PERMISSIONS_KEY = Symbol('permissions');

/**
 * Declare which permissions are required for this route. The user must have
 * at least one of the listed permissions (OR logic). Checked by
 * {@link PermissionGuard} via the static role→permission map.
 *
 * Automatically applies `@UseGuards(PermissionGuard)`.
 *
 * @example
 * ```ts
 * @Permissions(Permission.REPAIR_REQUEST_ASSIGN)
 * @Post(':id/assign')
 * async assign(...) { ... }
 * ```
 */
export function Permissions(...permissions: Permission[]) {
    return applyDecorators(
        SetMetadata(PERMISSIONS_KEY, permissions),
        UseGuards(PermissionGuard),
    );
}
