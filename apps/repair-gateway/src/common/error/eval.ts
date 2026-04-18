import { AppErrors as BaseAppErrors, createAppError } from '@asko/shared';
import type { TranslatableMessage } from '@asko/shared';
import { GatewayErrorTypeEnum } from './error-type.enum';

export { createAppError } from '@asko/shared';

export const AppErrors = {
    ...BaseAppErrors,

    // --- Validation ---
    invalidObjectId: (msg?: string | TranslatableMessage) => createAppError(GatewayErrorTypeEnum.INVALID_OBJECT_ID, msg),
    invalidRange: (msg?: string | TranslatableMessage) => createAppError(GatewayErrorTypeEnum.INVALID_RANGE, msg),
    invalidOrderStatus: (msg?: string | TranslatableMessage) => createAppError(GatewayErrorTypeEnum.INVALID_ORDER_STATUS, msg),

    // --- Payment ---
    paymentFailed: (msg?: string | TranslatableMessage) => createAppError(GatewayErrorTypeEnum.PAYMENT_FAILED, msg),
    paymentDeclined: (msg?: string | TranslatableMessage) => createAppError(GatewayErrorTypeEnum.PAYMENT_DECLINED, msg),
    paymentNotFound: (msg?: string | TranslatableMessage) => createAppError(GatewayErrorTypeEnum.PAYMENT_NOT_FOUND, msg),
    paymentAlreadyProcessed: (msg?: string | TranslatableMessage) => createAppError(GatewayErrorTypeEnum.PAYMENT_ALREADY_PROCESSED, msg),

    // --- Repair ---
    repairNotFound: (msg?: string | TranslatableMessage) => createAppError(GatewayErrorTypeEnum.REPAIR_NOT_FOUND, msg),
    repairInvalidStatus: (msg?: string | TranslatableMessage) => createAppError(GatewayErrorTypeEnum.REPAIR_INVALID_STATUS, msg),
    deviceNotFound: (msg?: string | TranslatableMessage) => createAppError(GatewayErrorTypeEnum.DEVICE_NOT_FOUND, msg),
    certificateNotFound: (msg?: string | TranslatableMessage) => createAppError(GatewayErrorTypeEnum.CERTIFICATE_NOT_FOUND, msg),
    repairerNotFound: (msg?: string | TranslatableMessage) => createAppError(GatewayErrorTypeEnum.REPAIRER_NOT_FOUND, msg),

    // --- Misc ---
    fileUploadFailed: (msg?: string | TranslatableMessage) => createAppError(GatewayErrorTypeEnum.FILE_UPLOAD_FAILED, msg),
    externalServiceUnavailable: (msg?: string | TranslatableMessage) => createAppError(GatewayErrorTypeEnum.EXTERNAL_SERVICE_UNAVAILABLE, msg),
};
