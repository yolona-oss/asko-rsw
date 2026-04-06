export { AppErrorTypeEnum } from '@asko/shared';

/**
 * Repair-gateway-specific error codes.
 */
export enum GatewayErrorTypeEnum {
    // --- Validation (range 702+) ---
    INVALID_OBJECT_ID = 702,
    INVALID_RANGE,
    INVALID_ORDER_STATUS,

    // --- Payment (range 1000+) ---
    PAYMENT_FAILED = 1000,
    PAYMENT_DECLINED,
    PAYMENT_NOT_FOUND,
    PAYMENT_ALREADY_PROCESSED,

    // --- Repair (range 1300+) ---
    REPAIR_NOT_FOUND = 1300,
    REPAIR_INVALID_STATUS,
    DEVICE_NOT_FOUND,
    CERTIFICATE_NOT_FOUND,
    REPAIRER_NOT_FOUND,

    // --- Misc (range 1200+) ---
    FILE_UPLOAD_FAILED = 1200,
    EXTERNAL_SERVICE_UNAVAILABLE,
}
