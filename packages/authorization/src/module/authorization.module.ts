import { DynamicModule, Module } from '@nestjs/common';
import { PermissionGuard } from '../permissions/permission.guard.js';
import { PolicyGuard } from '../policies/policy.guard.js';

/**
 * Injection token for the optional MetricsService.
 * Gateways that have `@asko/observability` provide their MetricsService
 * instance under this token so guards can emit `access_assert_total`.
 */
export const AUTHORIZATION_METRICS = Symbol('AUTHORIZATION_METRICS');

/**
 * Authorization module providing PermissionGuard and PolicyGuard.
 *
 * Import via `AuthorizationModule.forRoot()` in each gateway's AppModule.
 * Both guards are exported as providers (not registered as APP_GUARD —
 * they're applied per-route via decorators or @UseGuards).
 */
@Module({})
export class AuthorizationModule {
    static forRoot(): DynamicModule {
        return {
            module: AuthorizationModule,
            global: true,
            providers: [
                PermissionGuard,
                PolicyGuard,
            ],
            exports: [
                PermissionGuard,
                PolicyGuard,
            ],
        };
    }
}
