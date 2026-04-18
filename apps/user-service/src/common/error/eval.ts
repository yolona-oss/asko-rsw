import { AppErrors as BaseAppErrors, createAppError } from '@asko/shared';
import type { TranslatableMessage } from '@asko/shared';
import { UserErrorTypeEnum } from './error-type.enum';

export { createAppError } from '@asko/shared';

export const AppErrors = {
    ...BaseAppErrors,

    // --- Validation ---
    invalidObjectId: (msg?: string | TranslatableMessage) => createAppError(UserErrorTypeEnum.INVALID_OBJECT_ID, msg),
    invalidRange: (msg?: string | TranslatableMessage) => createAppError(UserErrorTypeEnum.INVALID_RANGE, msg),
    invalidOrderStatus: (msg?: string | TranslatableMessage) => createAppError(UserErrorTypeEnum.INVALID_ORDER_STATUS, msg),

    // --- Auth / User ---
    userNotFound: (msg?: string | TranslatableMessage) => createAppError(UserErrorTypeEnum.USER_NOT_FOUND, msg),
    userAlreadyExists: (msg?: string | TranslatableMessage) => createAppError(UserErrorTypeEnum.USER_ALREADY_EXISTS, msg),
    invalidCredentials: (msg?: string | TranslatableMessage) => createAppError(UserErrorTypeEnum.INVALID_CREDENTIALS, msg),
    emailNotConfirmed: (msg?: string | TranslatableMessage) => createAppError(UserErrorTypeEnum.EMAIL_NOT_CONFIRMED, msg),
    otpExpired: (msg?: string | TranslatableMessage) => createAppError(UserErrorTypeEnum.OTP_EXPIRED, msg),
    otpInvalid: (msg?: string | TranslatableMessage) => createAppError(UserErrorTypeEnum.OTP_INVALID, msg),
    tokenExpired: (msg?: string | TranslatableMessage) => createAppError(UserErrorTypeEnum.TOKEN_EXPIRED, msg),
    tokenInvalid: (msg?: string | TranslatableMessage) => createAppError(UserErrorTypeEnum.TOKEN_INVALID, msg),
    tooManyRequests: (msg?: string | TranslatableMessage) => createAppError(UserErrorTypeEnum.TOO_MANY_REQUESTS, msg),
};
