import { CanActivate, ExecutionContext, Injectable, Optional } from '@nestjs/common';
import { ModuleRef, Reflector } from '@nestjs/core';
import { AppErrors, REQUEST_USER_KEY } from '@asko/shared';
import type { AccessTokenPayload } from '@asko/shared';
import type { MetricsService } from '@asko/observability';

import type { Policy, PolicyContext } from './policy.interface.js';
import { CHECK_POLICY_KEY, type CheckPolicyMetadata } from './check-policy.decorator.js';

/**
 * Route-level guard that enforces `@CheckPolicy(...)` metadata.
 * Resolves the policy from the DI container, builds a {@link PolicyContext}
 * from the HTTP request, and delegates the authorization decision.
 *
 * Runs after JwtGuard (APP_GUARD) and after PermissionGuard (if both are used).
 * Applied automatically by the `@CheckPolicy()` decorator via `@UseGuards`.
 */
@Injectable()
export class PolicyGuard implements CanActivate {
    constructor(
        private readonly reflector: Reflector,
        private readonly moduleRef: ModuleRef,
        @Optional() private readonly metrics?: MetricsService,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const meta = this.reflector.getAllAndOverride<CheckPolicyMetadata | undefined>(
            CHECK_POLICY_KEY,
            [context.getHandler(), context.getClass()],
        );
        if (!meta) return true;

        const request = context.switchToHttp().getRequest();
        const user: AccessTokenPayload | undefined = request[REQUEST_USER_KEY];
        if (!user) throw AppErrors.unauthorized('Требуется авторизация');

        const policy: Policy = this.moduleRef.get(meta.policyClass, { strict: false });
        const policyName = meta.policyClass.name;

        const policyCtx: PolicyContext = {
            user,
            params: request.params ?? {},
            body: request.body,
            query: request.query ?? {},
        };

        try {
            const result = await policy.authorize(policyCtx);
            this.record(policyName, result ? 'allow' : 'deny');
            if (!result) throw AppErrors.forbidden('Доступ запрещён');
            return true;
        } catch (e: unknown) {
            const httpStatus = (e as any)?.httpStatus ?? (e as any)?.status;
            if (httpStatus === 403) {
                this.record(policyName, 'deny');
            } else if (httpStatus === 404) {
                this.record(policyName, 'not_found');
            } else {
                this.record(policyName, 'error');
            }
            throw e;
        }
    }

    private record(assertion: string, outcome: 'allow' | 'deny' | 'not_found' | 'error'): void {
        this.metrics?.accessAssertTotal.inc({ assertion, outcome });
    }
}
