export { AppErrorTypeEnum } from '@asko/shared';

/**
 * Gateway-specific error codes.
 * The gateway proxies all microservices, so it needs codes from every domain.
 */
export enum GatewayErrorTypeEnum {
    // --- Validation (range 702+) ---
    INVALID_OBJECT_ID = 702,
    INVALID_RANGE,
    INVALID_ORDER_STATUS,

    // --- Auth / User (range 800+) ---
    USER_NOT_FOUND = 800,
    USER_ALREADY_EXISTS,
    INVALID_CREDENTIALS,
    EMAIL_NOT_CONFIRMED,
    OTP_EXPIRED,
    OTP_INVALID,
    TOKEN_EXPIRED,
    TOKEN_INVALID,
    TOO_MANY_REQUESTS,

    // --- Stock / Product / Cart (range 900+) ---
    PRODUCT_NOT_FOUND = 900,
    INGREDIENT_NOT_FOUND,
    OUT_OF_STOCK,
    INFINITE_STOCK_DISABLED,
    CART_EMPTY,
    CART_RULE_INVALID,

    // --- Payment (range 1000+) ---
    PAYMENT_FAILED = 1000,
    PAYMENT_DECLINED,
    PAYMENT_NOT_FOUND,
    PAYMENT_ALREADY_PROCESSED,

    // --- Delivery (range 1100+) ---
    COURIER_NOT_AVAILABLE = 1100,
    DELIVERY_ZONE_NOT_FOUND,
    ORDER_ALREADY_ASSIGNED,
    ORDER_NOT_ASSIGNABLE,

    // --- Misc (range 1200+) ---
    FILE_UPLOAD_FAILED = 1200,
    EXTERNAL_SERVICE_UNAVAILABLE,
}
