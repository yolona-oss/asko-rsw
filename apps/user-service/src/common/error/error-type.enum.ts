export { AppErrorTypeEnum } from '@asko/shared';

// Domain-specific user/auth error codes
export enum UserErrorTypeEnum {
    // --- Validation (range 702+, after shared VALIDATION_ERROR=701) ---
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
}
