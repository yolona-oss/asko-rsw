import { AppErrors as BaseAppErrors, createAppError } from '@asko/shared';
import { GatewayErrorTypeEnum } from './error-type.enum';

export { createAppError } from '@asko/shared';

export const AppErrors = {
    ...BaseAppErrors,

    // --- Validation ---
    invalidObjectId: (msg?: string) => createAppError(GatewayErrorTypeEnum.INVALID_OBJECT_ID, msg),
    invalidRange: (msg?: string) => createAppError(GatewayErrorTypeEnum.INVALID_RANGE, msg),
    invalidOrderStatus: (msg?: string) => createAppError(GatewayErrorTypeEnum.INVALID_ORDER_STATUS, msg),

    // --- Payment ---
    paymentFailed: (msg?: string) => createAppError(GatewayErrorTypeEnum.PAYMENT_FAILED, msg),
    paymentDeclined: (msg?: string) => createAppError(GatewayErrorTypeEnum.PAYMENT_DECLINED, msg),
    paymentNotFound: (msg?: string) => createAppError(GatewayErrorTypeEnum.PAYMENT_NOT_FOUND, msg),
    paymentAlreadyProcessed: (msg?: string) => createAppError(GatewayErrorTypeEnum.PAYMENT_ALREADY_PROCESSED, msg),

    // --- Repair ---
    repairNotFound: (msg?: string) => createAppError(GatewayErrorTypeEnum.REPAIR_NOT_FOUND, msg),
    repairInvalidStatus: (msg?: string) => createAppError(GatewayErrorTypeEnum.REPAIR_INVALID_STATUS, msg),
    deviceNotFound: (msg?: string) => createAppError(GatewayErrorTypeEnum.DEVICE_NOT_FOUND, msg),
    certificateNotFound: (msg?: string) => createAppError(GatewayErrorTypeEnum.CERTIFICATE_NOT_FOUND, msg),
    repairerNotFound: (msg?: string) => createAppError(GatewayErrorTypeEnum.REPAIRER_NOT_FOUND, msg),

    // --- Misc ---
    fileUploadFailed: (msg?: string) => createAppError(GatewayErrorTypeEnum.FILE_UPLOAD_FAILED, msg),
    externalServiceUnavailable: (msg?: string) => createAppError(GatewayErrorTypeEnum.EXTERNAL_SERVICE_UNAVAILABLE, msg),
};
