export { AppErrorTypeEnum } from '@asko/shared';

/**
 * Gateway-specific error codes.
 */
export enum GatewayErrorTypeEnum {
    // --- Validation (range 702+) ---
    INVALID_OBJECT_ID = 702,
    INVALID_RANGE,

    // --- Auth / User (range 800+) ---
    USER_NOT_FOUND = 800,
    USER_ALREADY_EXISTS,
    INVALID_CREDENTIALS,
    EMAIL_NOT_CONFIRMED,
    TOKEN_EXPIRED = 806,
    TOKEN_INVALID,

    // --- Misc (range 1200+) ---
    FILE_UPLOAD_FAILED = 1200,
    EXTERNAL_SERVICE_UNAVAILABLE,
}
