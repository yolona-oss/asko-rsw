import { AppErrors as BaseAppErrors, createAppError } from '@asko/shared';
import { GatewayErrorTypeEnum } from './error-type.enum';

export { createAppError } from '@asko/shared';

export const AppErrors = {
    ...BaseAppErrors,

    // --- Validation ---
    invalidObjectId: (msg?: string) => createAppError(GatewayErrorTypeEnum.INVALID_OBJECT_ID, msg),
    invalidRange: (msg?: string) => createAppError(GatewayErrorTypeEnum.INVALID_RANGE, msg),
    invalidOrderStatus: (msg?: string) => createAppError(GatewayErrorTypeEnum.INVALID_ORDER_STATUS, msg),

    // --- Auth ---
    userNotFound: (msg?: string) => createAppError(GatewayErrorTypeEnum.USER_NOT_FOUND, msg),
    userAlreadyExists: (msg?: string) => createAppError(GatewayErrorTypeEnum.USER_ALREADY_EXISTS, msg),
    invalidCredentials: (msg?: string) => createAppError(GatewayErrorTypeEnum.INVALID_CREDENTIALS, msg),
    emailNotConfirmed: (msg?: string) => createAppError(GatewayErrorTypeEnum.EMAIL_NOT_CONFIRMED, msg),
    otpExpired: (msg?: string) => createAppError(GatewayErrorTypeEnum.OTP_EXPIRED, msg),
    otpInvalid: (msg?: string) => createAppError(GatewayErrorTypeEnum.OTP_INVALID, msg),
    tokenExpired: (msg?: string) => createAppError(GatewayErrorTypeEnum.TOKEN_EXPIRED, msg),
    tokenInvalid: (msg?: string) => createAppError(GatewayErrorTypeEnum.TOKEN_INVALID, msg),
    tooManyRequests: (msg?: string) => createAppError(GatewayErrorTypeEnum.TOO_MANY_REQUESTS, msg),

    // --- Stock / Cart ---
    productNotFound: (msg?: string) => createAppError(GatewayErrorTypeEnum.PRODUCT_NOT_FOUND, msg),
    ingredientNotFound: (msg?: string) => createAppError(GatewayErrorTypeEnum.INGREDIENT_NOT_FOUND, msg),
    outOfStock: (msg?: string) => createAppError(GatewayErrorTypeEnum.OUT_OF_STOCK, msg),
    infiniteStockDisabled: (msg?: string) => createAppError(GatewayErrorTypeEnum.INFINITE_STOCK_DISABLED, msg),
    cartEmpty: (msg?: string) => createAppError(GatewayErrorTypeEnum.CART_EMPTY, msg),
    cartRuleInvalid: (msg?: string) => createAppError(GatewayErrorTypeEnum.CART_RULE_INVALID, msg),

    // --- Payment ---
    paymentFailed: (msg?: string) => createAppError(GatewayErrorTypeEnum.PAYMENT_FAILED, msg),
    paymentDeclined: (msg?: string) => createAppError(GatewayErrorTypeEnum.PAYMENT_DECLINED, msg),
    paymentNotFound: (msg?: string) => createAppError(GatewayErrorTypeEnum.PAYMENT_NOT_FOUND, msg),
    paymentAlreadyProcessed: (msg?: string) => createAppError(GatewayErrorTypeEnum.PAYMENT_ALREADY_PROCESSED, msg),

    // --- Delivery ---
    courierNotAvailable: (msg?: string) => createAppError(GatewayErrorTypeEnum.COURIER_NOT_AVAILABLE, msg),
    deliveryZoneNotFound: (msg?: string) => createAppError(GatewayErrorTypeEnum.DELIVERY_ZONE_NOT_FOUND, msg),
    orderAlreadyAssigned: (msg?: string) => createAppError(GatewayErrorTypeEnum.ORDER_ALREADY_ASSIGNED, msg),
    orderNotAssignable: (msg?: string) => createAppError(GatewayErrorTypeEnum.ORDER_NOT_ASSIGNABLE, msg),

    // --- Misc ---
    fileUploadFailed: (msg?: string) => createAppError(GatewayErrorTypeEnum.FILE_UPLOAD_FAILED, msg),
    externalServiceUnavailable: (msg?: string) => createAppError(GatewayErrorTypeEnum.EXTERNAL_SERVICE_UNAVAILABLE, msg),
};
