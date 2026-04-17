import { applyDecorators, SetMetadata, UseGuards, type Type } from '@nestjs/common';
import type { Policy } from './policy.interface.js';
import { PolicyGuard } from './policy.guard.js';

export const CHECK_POLICY_KEY = Symbol('check_policy');

export interface CheckPolicyOptions {
    /**
     * Which route param holds the resource identifier.
     * Defaults to `'id'`. The full `params` map is always available
     * in `PolicyContext.params` regardless of this setting.
     */
    paramKey?: string;
}

export interface CheckPolicyMetadata {
    policyClass: Type<Policy>;
    options: CheckPolicyOptions;
}

/**
 * Declare a policy that must pass before this route handler executes.
 * The policy is resolved from the NestJS DI container and receives
 * a {@link PolicyContext} built from the HTTP request.
 *
 * Automatically applies `@UseGuards(PolicyGuard)`.
 *
 * @example
 * ```ts
 * @CheckPolicy(RepairParticipantPolicy)
 * @Post(':id/images')
 * async uploadImage(...) { ... }
 *
 * @CheckPolicy(BrokenPartAccessPolicy, { paramKey: 'partId' })
 * @Post(':id/broken-parts/:partId/images')
 * async uploadPartImage(...) { ... }
 * ```
 */
export function CheckPolicy(
    policyClass: Type<Policy>,
    options?: CheckPolicyOptions,
): MethodDecorator {
    const meta: CheckPolicyMetadata = {
        policyClass,
        options: options ?? {},
    };
    return applyDecorators(
        SetMetadata(CHECK_POLICY_KEY, meta),
        UseGuards(PolicyGuard),
    );
}
