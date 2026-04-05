import { AppErrors as BaseAppErrors, createAppError } from '@asko/shared';
import { UserErrorTypeEnum } from './error-type.enum';

export { createAppError } from '@asko/shared';

export const AppErrors = {
    ...BaseAppErrors,

    // --- Validation ---
    invalidObjectId: (msg?: string) => createAppError(UserErrorTypeEnum.INVALID_OBJECT_ID, msg),
    invalidRange: (msg?: string) => createAppError(UserErrorTypeEnum.INVALID_RANGE, msg),
    invalidOrderStatus: (msg?: string) => createAppError(UserErrorTypeEnum.INVALID_ORDER_STATUS, msg),

    // --- Auth / User ---
    userNotFound: (msg?: string) => createAppError(UserErrorTypeEnum.USER_NOT_FOUND, msg),
    userAlreadyExists: (msg?: string) => createAppError(UserErrorTypeEnum.USER_ALREADY_EXISTS, msg),
    invalidCredentials: (msg?: string) => createAppError(UserErrorTypeEnum.INVALID_CREDENTIALS, msg),
    emailNotConfirmed: (msg?: string) => createAppError(UserErrorTypeEnum.EMAIL_NOT_CONFIRMED, msg),
    otpExpired: (msg?: string) => createAppError(UserErrorTypeEnum.OTP_EXPIRED, msg),
    otpInvalid: (msg?: string) => createAppError(UserErrorTypeEnum.OTP_INVALID, msg),
    tokenExpired: (msg?: string) => createAppError(UserErrorTypeEnum.TOKEN_EXPIRED, msg),
    tokenInvalid: (msg?: string) => createAppError(UserErrorTypeEnum.TOKEN_INVALID, msg),
    tooManyRequests: (msg?: string) => createAppError(UserErrorTypeEnum.TOO_MANY_REQUESTS, msg),
};
