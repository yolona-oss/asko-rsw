import { AppErrors as BaseAppErrors, createAppError } from '@asko/shared';
import { ChatErrorTypeEnum } from './error-type.enum';

export { createAppError } from '@asko/shared';

export const AppErrors = {
    ...BaseAppErrors,

    // --- Chat ---
    conversationNotFound: (msg?: string) => createAppError(ChatErrorTypeEnum.CONVERSATION_NOT_FOUND, msg),
    messageNotFound: (msg?: string) => createAppError(ChatErrorTypeEnum.MESSAGE_NOT_FOUND, msg),
    participantNotFound: (msg?: string) => createAppError(ChatErrorTypeEnum.PARTICIPANT_NOT_FOUND, msg),
    alreadyParticipant: (msg?: string) => createAppError(ChatErrorTypeEnum.ALREADY_PARTICIPANT, msg),
    notParticipant: (msg?: string) => createAppError(ChatErrorTypeEnum.NOT_PARTICIPANT, msg),
    cannotDeleteConversation: (msg?: string) => createAppError(ChatErrorTypeEnum.CANNOT_DELETE_CONVERSATION, msg),
    directConversationExists: (msg?: string) => createAppError(ChatErrorTypeEnum.DIRECT_CONVERSATION_EXISTS, msg),
    conversationClosed: (msg?: string) => createAppError(ChatErrorTypeEnum.CONVERSATION_CLOSED, msg ?? 'Conversation is closed'),
};
