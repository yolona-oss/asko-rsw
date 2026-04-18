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

    // --- Auth ---
    userNotFound: (msg?: string | TranslatableMessage) => createAppError(GatewayErrorTypeEnum.USER_NOT_FOUND, msg),
    userAlreadyExists: (msg?: string | TranslatableMessage) => createAppError(GatewayErrorTypeEnum.USER_ALREADY_EXISTS, msg),
    invalidCredentials: (msg?: string | TranslatableMessage) => createAppError(GatewayErrorTypeEnum.INVALID_CREDENTIALS, msg),
    emailNotConfirmed: (msg?: string | TranslatableMessage) => createAppError(GatewayErrorTypeEnum.EMAIL_NOT_CONFIRMED, msg),
    otpExpired: (msg?: string | TranslatableMessage) => createAppError(GatewayErrorTypeEnum.OTP_EXPIRED, msg),
    otpInvalid: (msg?: string | TranslatableMessage) => createAppError(GatewayErrorTypeEnum.OTP_INVALID, msg),
    tokenExpired: (msg?: string | TranslatableMessage) => createAppError(GatewayErrorTypeEnum.TOKEN_EXPIRED, msg),
    tokenInvalid: (msg?: string | TranslatableMessage) => createAppError(GatewayErrorTypeEnum.TOKEN_INVALID, msg),
    tooManyRequests: (msg?: string | TranslatableMessage) => createAppError(GatewayErrorTypeEnum.TOO_MANY_REQUESTS, msg),

    // --- Stock / Cart ---
    productNotFound: (msg?: string | TranslatableMessage) => createAppError(GatewayErrorTypeEnum.PRODUCT_NOT_FOUND, msg),
    ingredientNotFound: (msg?: string | TranslatableMessage) => createAppError(GatewayErrorTypeEnum.INGREDIENT_NOT_FOUND, msg),
    outOfStock: (msg?: string | TranslatableMessage) => createAppError(GatewayErrorTypeEnum.OUT_OF_STOCK, msg),
    infiniteStockDisabled: (msg?: string | TranslatableMessage) => createAppError(GatewayErrorTypeEnum.INFINITE_STOCK_DISABLED, msg),
    cartEmpty: (msg?: string | TranslatableMessage) => createAppError(GatewayErrorTypeEnum.CART_EMPTY, msg),
    cartRuleInvalid: (msg?: string | TranslatableMessage) => createAppError(GatewayErrorTypeEnum.CART_RULE_INVALID, msg),

    // --- Payment ---
    paymentFailed: (msg?: string | TranslatableMessage) => createAppError(GatewayErrorTypeEnum.PAYMENT_FAILED, msg),
    paymentDeclined: (msg?: string | TranslatableMessage) => createAppError(GatewayErrorTypeEnum.PAYMENT_DECLINED, msg),
    paymentNotFound: (msg?: string | TranslatableMessage) => createAppError(GatewayErrorTypeEnum.PAYMENT_NOT_FOUND, msg),
    paymentAlreadyProcessed: (msg?: string | TranslatableMessage) => createAppError(GatewayErrorTypeEnum.PAYMENT_ALREADY_PROCESSED, msg),

    // --- Delivery ---
    courierNotAvailable: (msg?: string | TranslatableMessage) => createAppError(GatewayErrorTypeEnum.COURIER_NOT_AVAILABLE, msg),
    deliveryZoneNotFound: (msg?: string | TranslatableMessage) => createAppError(GatewayErrorTypeEnum.DELIVERY_ZONE_NOT_FOUND, msg),
    orderAlreadyAssigned: (msg?: string | TranslatableMessage) => createAppError(GatewayErrorTypeEnum.ORDER_ALREADY_ASSIGNED, msg),
    orderNotAssignable: (msg?: string | TranslatableMessage) => createAppError(GatewayErrorTypeEnum.ORDER_NOT_ASSIGNABLE, msg),

    // --- Misc ---
    fileUploadFailed: (msg?: string | TranslatableMessage) => createAppError(GatewayErrorTypeEnum.FILE_UPLOAD_FAILED, msg),
    externalServiceUnavailable: (msg?: string | TranslatableMessage) => createAppError(GatewayErrorTypeEnum.EXTERNAL_SERVICE_UNAVAILABLE, msg),
};
