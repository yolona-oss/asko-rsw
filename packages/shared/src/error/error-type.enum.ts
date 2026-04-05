/**
 * Common error codes shared by all services.
 * Domain-specific codes are defined locally in each service
 * using their own `const enum` with non-overlapping numeric ranges.
 *
 * NOTE: This is a regular `enum` (not `const enum`) so it works
 * across package boundaries with `isolatedModules: true`.
 */
export enum AppErrorTypeEnum {
    // --- Generic / HTTP Errors ---
    BAD_REQUEST = 400,
    UNAUTHORIZED = 401,
    FORBIDDEN = 403,
    NOT_FOUND = 404,
    CONFLICT = 409,
    INTERNAL_ERROR = 500,

    // --- Database Errors ---
    DB_CANNOT_READ = 600,
    DB_CANNOT_CREATE,
    DB_CANNOT_UPDATE,
    DB_CANNOT_DELETE,
    DB_ENTITY_EXISTS,
    DB_ENTITY_NOT_FOUND,
    DB_DUPLICATE_KEY,
    DB_INCORRECT_MODEL,

    // --- Validation / Input Errors ---
    INVALID_DATA = 700,
    VALIDATION_ERROR,
}
