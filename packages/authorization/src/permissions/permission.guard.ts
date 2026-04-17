import { CanActivate, ExecutionContext, Injectable, Optional } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AppErrors, REQUEST_USER_KEY } from '@asko/shared';
import type { JwtPayload } from '@asko/shared';
import type { MetricsService } from '@asko/observability';

import { Permission } from './permission.enum.js';
import { PERMISSIONS_KEY } from './permission.decorator.js';
import { resolvePermissions } from './resolve-permissions.js';

/**
 * Route-level guard that enforces `@Permissions(...)` metadata.
 * Resolves user permissions from the static role→permission map and checks
 * whether the user has at least one of the required permissions (OR logic).
 *
 * Pure computation — no I/O, no gRPC calls. Runs after JwtGuard (APP_GUARD).
 *
 * Register on controller or method via `@UseGuards(PermissionGuard)`,
 * or use `AuthorizationModule.forRoot()` which registers both guards globally.
 */
@Injectable()
export class PermissionGuard implements CanActivate {
    constructor(
        private readonly reflector: Reflector,
        @Optional() private readonly metrics?: MetricsService,
    ) {}

    canActivate(context: ExecutionContext): boolean {
        const required = this.reflector.getAllAndOverride<Permission[] | undefined>(
            PERMISSIONS_KEY,
            [context.getHandler(), context.getClass()],
        );
        if (!required || required.length === 0) return true;

        const request = context.switchToHttp().getRequest();
        const user: JwtPayload | undefined = request[REQUEST_USER_KEY];
        if (!user) throw AppErrors.unauthorized('Требуется авторизация');

        const userPerms = resolvePermissions(user.roles);
        const allowed = required.some((p) => userPerms.has(p));

        const assertion = `permission:${required.join(',')}`;
        this.metrics?.accessAssertTotal.inc({
            assertion,
            outcome: allowed ? 'allow' : 'deny',
        });

        if (!allowed) {
            throw AppErrors.forbidden('Недостаточно прав');
        }
        return true;
    }
}
