import { AppErrors as BaseAppErrors, createAppError } from '@asko/shared';
import { RealtimeGatewayErrorTypeEnum } from './error-type.enum';

export { createAppError } from '@asko/shared';

export const AppErrors = {
    ...BaseAppErrors,

    // --- Auth ---
    tokenExpired: (msg?: string) => createAppError(RealtimeGatewayErrorTypeEnum.TOKEN_EXPIRED, msg),
    tokenInvalid: (msg?: string) => createAppError(RealtimeGatewayErrorTypeEnum.TOKEN_INVALID, msg),

    // --- Chat ---
    conversationNotFound: (msg?: string) => createAppError(RealtimeGatewayErrorTypeEnum.CONVERSATION_NOT_FOUND, msg),
    messageNotFound: (msg?: string) => createAppError(RealtimeGatewayErrorTypeEnum.MESSAGE_NOT_FOUND, msg),
    chatPrivacyDenied: (msg?: string) => createAppError(RealtimeGatewayErrorTypeEnum.CHAT_PRIVACY_DENIED, msg),
    participantNotInConversation: (msg?: string) => createAppError(RealtimeGatewayErrorTypeEnum.PARTICIPANT_NOT_IN_CONVERSATION, msg),

    // --- Notification ---
    notificationNotFound: (msg?: string) => createAppError(RealtimeGatewayErrorTypeEnum.NOTIFICATION_NOT_FOUND, msg),
};
