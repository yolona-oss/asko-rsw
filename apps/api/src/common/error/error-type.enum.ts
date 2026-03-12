/**
 * Enum defining unique error codes used across the app.
 * Always extend this, don't remove existing codes.
 */
export const enum AppErrorTypeEnum {
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
    INVALID_OBJECT_ID,
    INVALID_RANGE,
    INVALID_ORDER_STATUS,

    // --- Auth / User Errors ---
    USER_NOT_FOUND = 800,
    USER_ALREADY_EXISTS,
    INVALID_CREDENTIALS,
    EMAIL_NOT_CONFIRMED,
    OTP_EXPIRED,
    OTP_INVALID,
    TOKEN_EXPIRED,
    TOKEN_INVALID,
    TOO_MANY_REQUESTS,

    // --- Stock / Product / Cart ---
    PRODUCT_NOT_FOUND = 900,
    INGREDIENT_NOT_FOUND,
    OUT_OF_STOCK,
    INFINITE_STOCK_DISABLED,
    CART_EMPTY,
    CART_RULE_INVALID,

    // --- Payment ---
    PAYMENT_FAILED = 1000,
    PAYMENT_DECLINED,
    PAYMENT_NOT_FOUND,
    PAYMENT_ALREADY_PROCESSED,

    // --- Delivery ---
    COURIER_NOT_AVAILABLE = 1100,
    DELIVERY_ZONE_NOT_FOUND,
    ORDER_ALREADY_ASSIGNED,
    ORDER_NOT_ASSIGNABLE,

    // --- Misc ---
    FILE_UPLOAD_FAILED = 1200,
    EXTERNAL_SERVICE_UNAVAILABLE,
}
