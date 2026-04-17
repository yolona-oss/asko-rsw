import type { JwtPayload } from '@asko/shared';

/**
 * Context passed to every {@link Policy.authorize} call. Built from the
 * HTTP request by {@link PolicyGuard}.
 */
export interface PolicyContext {
    /** Authenticated user from JWT. Always present (PolicyGuard rejects unauthenticated). */
    user: JwtPayload;
    /** Route parameters (e.g. `{ id: '...', partId: '...' }`). */
    params: Record<string, string>;
    /** Request body (may be undefined for GET routes). */
    body?: unknown;
    /** Query parameters. */
    query?: Record<string, string>;
}

/**
 * A policy encapsulates an authorization decision that may require I/O
 * (e.g. gRPC ownership lookups). Policies are NestJS injectables — they
 * can depend on gRPC client services, repositories, etc.
 *
 * Return `true` to allow, or throw an `AppError` / `HttpException` to deny.
 * Returning `false` results in a generic 403.
 *
 * Policies are resolved per-request via `ModuleRef` so they may be
 * `Scope.TRANSIENT` or `Scope.DEFAULT`.
 */
export interface Policy {
    authorize(ctx: PolicyContext): Promise<boolean>;
}
