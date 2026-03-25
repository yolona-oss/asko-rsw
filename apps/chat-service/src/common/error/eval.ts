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

    conversationNotFound: (msg?: string) => createAppError(AppErrorTypeEnum.CONVERSATION_NOT_FOUND, msg),
    messageNotFound: (msg?: string) => createAppError(AppErrorTypeEnum.MESSAGE_NOT_FOUND, msg),
    participantNotFound: (msg?: string) => createAppError(AppErrorTypeEnum.PARTICIPANT_NOT_FOUND, msg),
    alreadyParticipant: (msg?: string) => createAppError(AppErrorTypeEnum.ALREADY_PARTICIPANT, msg),
    notParticipant: (msg?: string) => createAppError(AppErrorTypeEnum.NOT_PARTICIPANT, msg),
    cannotDeleteConversation: (msg?: string) => createAppError(AppErrorTypeEnum.CANNOT_DELETE_CONVERSATION, msg),
    directConversationExists: (msg?: string) => createAppError(AppErrorTypeEnum.DIRECT_CONVERSATION_EXISTS, msg),
};
