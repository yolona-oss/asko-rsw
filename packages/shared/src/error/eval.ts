import { AppError } from './app-error.js';
import { AppErrorTypeEnum } from './error-type.enum.js';
import type { TranslatableMessage } from '../i18n/translate.js';
import { t } from '../i18n/translate.js';

export type { TranslatableMessage };

export function createAppError(
    type: number,
    msg?: string | TranslatableMessage,
): AppError {
    if (msg && typeof msg === 'object' && 'key' in msg) {
        // Structured translatable message — English fallback for logs
        return new AppError(type, {
            message: t(msg.key, 'en', msg.params),
            messageKey: msg.key,
            messageParams: msg.params,
        });
    }
    return new AppError(type, msg ? { message: msg } : undefined);
}

export const AppErrors = {
    // --- Generic ---
    badRequest: (msg?: string | TranslatableMessage) => createAppError(AppErrorTypeEnum.BAD_REQUEST, msg),
    unauthorized: (msg?: string | TranslatableMessage) => createAppError(AppErrorTypeEnum.UNAUTHORIZED, msg),
    forbidden: (msg?: string | TranslatableMessage) => createAppError(AppErrorTypeEnum.FORBIDDEN, msg),
    notFound: (msg?: string | TranslatableMessage) => createAppError(AppErrorTypeEnum.NOT_FOUND, msg),
    conflict: (msg?: string | TranslatableMessage) => createAppError(AppErrorTypeEnum.CONFLICT, msg),
    internalError: (msg?: string | TranslatableMessage) => createAppError(AppErrorTypeEnum.INTERNAL_ERROR, msg),

    // --- DB ---
    dbCannotRead: (msg?: string | TranslatableMessage) => createAppError(AppErrorTypeEnum.DB_CANNOT_READ, msg),
    dbCannotCreate: (msg?: string | TranslatableMessage) => createAppError(AppErrorTypeEnum.DB_CANNOT_CREATE, msg),
    dbCannotUpdate: (msg?: string | TranslatableMessage) => createAppError(AppErrorTypeEnum.DB_CANNOT_UPDATE, msg),
    dbCannotDelete: (msg?: string | TranslatableMessage) => createAppError(AppErrorTypeEnum.DB_CANNOT_DELETE, msg),
    dbEntityExists: (msg?: string | TranslatableMessage) => createAppError(AppErrorTypeEnum.DB_ENTITY_EXISTS, msg),
    dbEntityNotFound: (msg?: string | TranslatableMessage) => createAppError(AppErrorTypeEnum.DB_ENTITY_NOT_FOUND, msg),
    dbDuplicateKey: (msg?: string | TranslatableMessage) => createAppError(AppErrorTypeEnum.DB_DUPLICATE_KEY, msg),
    dbIncorrectModel: (msg?: string | TranslatableMessage) => createAppError(AppErrorTypeEnum.DB_INCORRECT_MODEL, msg),

    // --- Validation ---
    invalidData: (msg?: string | TranslatableMessage) => createAppError(AppErrorTypeEnum.INVALID_DATA, msg),
    validationError: (msg?: string | TranslatableMessage) => createAppError(AppErrorTypeEnum.VALIDATION_ERROR, msg),
};
