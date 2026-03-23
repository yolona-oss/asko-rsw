import { AppError } from './app-error';
import { AppErrorTypeEnum } from './error-type.enum';

function createAppError(type: AppErrorTypeEnum, message?: string): AppError {
    return new AppError(type, message ? { message } : undefined);
}

export const AppErrors = {
    badRequest: (msg?: string) => createAppError(AppErrorTypeEnum.BAD_REQUEST, msg),
    notFound: (msg?: string) => createAppError(AppErrorTypeEnum.NOT_FOUND, msg),
    conflict: (msg?: string) => createAppError(AppErrorTypeEnum.CONFLICT, msg),
    internalError: (msg?: string) => createAppError(AppErrorTypeEnum.INTERNAL_ERROR, msg),

    dbEntityNotFound: (msg?: string) => createAppError(AppErrorTypeEnum.DB_ENTITY_NOT_FOUND, msg),
    dbEntityExists: (msg?: string) => createAppError(AppErrorTypeEnum.DB_ENTITY_EXISTS, msg),

    invalidData: (msg?: string) => createAppError(AppErrorTypeEnum.INVALID_DATA, msg),

    certificateNotFound: (msg?: string) => createAppError(AppErrorTypeEnum.CERTIFICATE_NOT_FOUND, msg),
    certificateAlreadyExists: (msg?: string) => createAppError(AppErrorTypeEnum.CERTIFICATE_ALREADY_EXISTS, msg),
};
