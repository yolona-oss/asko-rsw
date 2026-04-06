import { AppErrors as BaseAppErrors, createAppError } from '@asko/shared';
import { GatewayErrorTypeEnum } from './error-type.enum';

export { createAppError } from '@asko/shared';

export const AppErrors = {
    ...BaseAppErrors,

    // --- Validation ---
    invalidObjectId: (msg?: string) => createAppError(GatewayErrorTypeEnum.INVALID_OBJECT_ID, msg),
    invalidRange: (msg?: string) => createAppError(GatewayErrorTypeEnum.INVALID_RANGE, msg),

    // --- Auth ---
    userNotFound: (msg?: string) => createAppError(GatewayErrorTypeEnum.USER_NOT_FOUND, msg),
    userAlreadyExists: (msg?: string) => createAppError(GatewayErrorTypeEnum.USER_ALREADY_EXISTS, msg),
    invalidCredentials: (msg?: string) => createAppError(GatewayErrorTypeEnum.INVALID_CREDENTIALS, msg),
    emailNotConfirmed: (msg?: string) => createAppError(GatewayErrorTypeEnum.EMAIL_NOT_CONFIRMED, msg),
    tokenExpired: (msg?: string) => createAppError(GatewayErrorTypeEnum.TOKEN_EXPIRED, msg),
    tokenInvalid: (msg?: string) => createAppError(GatewayErrorTypeEnum.TOKEN_INVALID, msg),

    // --- Misc ---
    fileUploadFailed: (msg?: string) => createAppError(GatewayErrorTypeEnum.FILE_UPLOAD_FAILED, msg),
    externalServiceUnavailable: (msg?: string) => createAppError(GatewayErrorTypeEnum.EXTERNAL_SERVICE_UNAVAILABLE, msg),
};
