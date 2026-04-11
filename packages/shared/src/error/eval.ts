import { AppError } from './app-error.js';
import { AppErrorTypeEnum } from './error-type.enum.js';

export function createAppError(
    type: number,
    message?: string,
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
};
