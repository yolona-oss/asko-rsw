import { AppError } from "./app-error";
import { AppErrorTypeEnum } from "./error-type.enum";

export function createAppError(
    type: AppErrorTypeEnum,
    message?: string
): AppError {
    return new AppError(type, message ? { message } : undefined);
}

export const AppErrors = {
    // --- Generic ---
    badRequest: (msg?: string) => createAppError(AppErrorTypeEnum.BAD_REQUEST, msg),
    unauthorized: (msg?: string) => createAppError(AppErrorTypeEnum.UNAUTHORIZED, msg),
    forbidden: (msg?: string) => createAppError(AppErrorTypeEnum.FORBIDDEN, msg),
    notFound: (msg?: string) => createAppError(AppErrorTypeEnum.NOT_FOUND, msg),
    conflict: (msg?: string) => createAppError(AppErrorTypeEnum.CONFLICT, msg),
    internalError: (msg?: string) => createAppError(AppErrorTypeEnum.INTERNAL_ERROR, msg),

    // --- DB ---
    dbCannotRead: (msg?: string) => createAppError(AppErrorTypeEnum.DB_CANNOT_READ, msg),
    dbCannotCreate: (msg?: string) => createAppError(AppErrorTypeEnum.DB_CANNOT_CREATE, msg),
    dbCannotUpdate: (msg?: string) => createAppError(AppErrorTypeEnum.DB_CANNOT_UPDATE, msg),
    dbCannotDelete: (msg?: string) => createAppError(AppErrorTypeEnum.DB_CANNOT_DELETE, msg),
    dbEntityExists: (msg?: string) => createAppError(AppErrorTypeEnum.DB_ENTITY_EXISTS, msg),
    dbEntityNotFound: (msg?: string) => createAppError(AppErrorTypeEnum.DB_ENTITY_NOT_FOUND, msg),
    dbDuplicateKey: (msg?: string) => createAppError(AppErrorTypeEnum.DB_DUPLICATE_KEY, msg),
    dbIncorrectModel: (msg?: string) => createAppError(AppErrorTypeEnum.DB_INCORRECT_MODEL, msg),

    // --- Validation ---
    invalidData: (msg?: string) => createAppError(AppErrorTypeEnum.INVALID_DATA, msg),
    validationError: (msg?: string) => createAppError(AppErrorTypeEnum.VALIDATION_ERROR, msg),
    invalidObjectId: (msg?: string) => createAppError(AppErrorTypeEnum.INVALID_OBJECT_ID, msg),
    invalidRange: (msg?: string) => createAppError(AppErrorTypeEnum.INVALID_RANGE, msg),
    invalidOrderStatus: (msg?: string) => createAppError(AppErrorTypeEnum.INVALID_ORDER_STATUS, msg),

    // --- Auth ---
    userNotFound: (msg?: string) => createAppError(AppErrorTypeEnum.USER_NOT_FOUND, msg),
    userAlreadyExists: (msg?: string) => createAppError(AppErrorTypeEnum.USER_ALREADY_EXISTS, msg),
    invalidCredentials: (msg?: string) => createAppError(AppErrorTypeEnum.INVALID_CREDENTIALS, msg),
    emailNotConfirmed: (msg?: string) => createAppError(AppErrorTypeEnum.EMAIL_NOT_CONFIRMED, msg),
    otpExpired: (msg?: string) => createAppError(AppErrorTypeEnum.OTP_EXPIRED, msg),
    otpInvalid: (msg?: string) => createAppError(AppErrorTypeEnum.OTP_INVALID, msg),
    tokenExpired: (msg?: string) => createAppError(AppErrorTypeEnum.TOKEN_EXPIRED, msg),
    tokenInvalid: (msg?: string) => createAppError(AppErrorTypeEnum.TOKEN_INVALID, msg),
    tooManyRequests: (msg?: string) => createAppError(AppErrorTypeEnum.TOO_MANY_REQUESTS, msg),

    // --- Stock / Cart ---
    productNotFound: (msg?: string) => createAppError(AppErrorTypeEnum.PRODUCT_NOT_FOUND, msg),
    ingredientNotFound: (msg?: string) => createAppError(AppErrorTypeEnum.INGREDIENT_NOT_FOUND, msg),
    outOfStock: (msg?: string) => createAppError(AppErrorTypeEnum.OUT_OF_STOCK, msg),
    infiniteStockDisabled: (msg?: string) => createAppError(AppErrorTypeEnum.INFINITE_STOCK_DISABLED, msg),
    cartEmpty: (msg?: string) => createAppError(AppErrorTypeEnum.CART_EMPTY, msg),
    cartRuleInvalid: (msg?: string) => createAppError(AppErrorTypeEnum.CART_RULE_INVALID, msg),

    // --- Payment ---
    paymentFailed: (msg?: string) => createAppError(AppErrorTypeEnum.PAYMENT_FAILED, msg),
    paymentDeclined: (msg?: string) => createAppError(AppErrorTypeEnum.PAYMENT_DECLINED, msg),
    paymentNotFound: (msg?: string) => createAppError(AppErrorTypeEnum.PAYMENT_NOT_FOUND, msg),
    paymentAlreadyProcessed: (msg?: string) => createAppError(AppErrorTypeEnum.PAYMENT_ALREADY_PROCESSED, msg),

    // --- Delivery ---
    courierNotAvailable: (msg?: string) => createAppError(AppErrorTypeEnum.COURIER_NOT_AVAILABLE, msg),
    deliveryZoneNotFound: (msg?: string) => createAppError(AppErrorTypeEnum.DELIVERY_ZONE_NOT_FOUND, msg),
    orderAlreadyAssigned: (msg?: string) => createAppError(AppErrorTypeEnum.ORDER_ALREADY_ASSIGNED, msg),
    orderNotAssignable: (msg?: string) => createAppError(AppErrorTypeEnum.ORDER_NOT_ASSIGNABLE, msg),

    // --- Misc ---
    fileUploadFailed: (msg?: string) => createAppError(AppErrorTypeEnum.FILE_UPLOAD_FAILED, msg),
    externalServiceUnavailable: (msg?: string) => createAppError(AppErrorTypeEnum.EXTERNAL_SERVICE_UNAVAILABLE, msg),
}
