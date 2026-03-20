import { AppError } from "./app-error";
import { AppErrorTypeEnum } from "./error-type.enum";

function createAppError(type: AppErrorTypeEnum, message?: string): AppError {
    return new AppError(type, message ? { message } : undefined);
}

export const AppErrors = {
    badRequest: (msg?: string) => createAppError(AppErrorTypeEnum.BAD_REQUEST, msg),
    unauthorized: (msg?: string) => createAppError(AppErrorTypeEnum.UNAUTHORIZED, msg),
    forbidden: (msg?: string) => createAppError(AppErrorTypeEnum.FORBIDDEN, msg),
    notFound: (msg?: string) => createAppError(AppErrorTypeEnum.NOT_FOUND, msg),
    conflict: (msg?: string) => createAppError(AppErrorTypeEnum.CONFLICT, msg),
    internalError: (msg?: string) => createAppError(AppErrorTypeEnum.INTERNAL_ERROR, msg),

    dbCannotRead: (msg?: string) => createAppError(AppErrorTypeEnum.DB_CANNOT_READ, msg),
    dbCannotCreate: (msg?: string) => createAppError(AppErrorTypeEnum.DB_CANNOT_CREATE, msg),
    dbCannotUpdate: (msg?: string) => createAppError(AppErrorTypeEnum.DB_CANNOT_UPDATE, msg),
    dbCannotDelete: (msg?: string) => createAppError(AppErrorTypeEnum.DB_CANNOT_DELETE, msg),
    dbEntityExists: (msg?: string) => createAppError(AppErrorTypeEnum.DB_ENTITY_EXISTS, msg),
    dbEntityNotFound: (msg?: string) => createAppError(AppErrorTypeEnum.DB_ENTITY_NOT_FOUND, msg),
    dbDuplicateKey: (msg?: string) => createAppError(AppErrorTypeEnum.DB_DUPLICATE_KEY, msg),
    dbIncorrectModel: (msg?: string) => createAppError(AppErrorTypeEnum.DB_INCORRECT_MODEL, msg),

    invalidData: (msg?: string) => createAppError(AppErrorTypeEnum.INVALID_DATA, msg),
    tokenInvalid: (msg?: string) => createAppError(AppErrorTypeEnum.TOKEN_INVALID, msg),
    tooManyRequests: (msg?: string) => createAppError(AppErrorTypeEnum.TOO_MANY_REQUESTS, msg),
};
