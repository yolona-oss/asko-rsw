import { AppErrors as BaseAppErrors, createAppError } from '@asko/shared';
import type { TranslatableMessage } from '@asko/shared';
import { RealtimeGatewayErrorTypeEnum } from './error-type.enum';

export { createAppError } from '@asko/shared';

export const AppErrors = {
    ...BaseAppErrors,

    // --- Auth ---
    tokenExpired: (msg?: string | TranslatableMessage) => createAppError(RealtimeGatewayErrorTypeEnum.TOKEN_EXPIRED, msg),
    tokenInvalid: (msg?: string | TranslatableMessage) => createAppError(RealtimeGatewayErrorTypeEnum.TOKEN_INVALID, msg),

    // --- Chat ---
    conversationNotFound: (msg?: string | TranslatableMessage) => createAppError(RealtimeGatewayErrorTypeEnum.CONVERSATION_NOT_FOUND, msg),
    messageNotFound: (msg?: string | TranslatableMessage) => createAppError(RealtimeGatewayErrorTypeEnum.MESSAGE_NOT_FOUND, msg),
    chatPrivacyDenied: (msg?: string | TranslatableMessage) => createAppError(RealtimeGatewayErrorTypeEnum.CHAT_PRIVACY_DENIED, msg),
    participantNotInConversation: (msg?: string | TranslatableMessage) => createAppError(RealtimeGatewayErrorTypeEnum.PARTICIPANT_NOT_IN_CONVERSATION, msg),

    // --- Notification ---
    notificationNotFound: (msg?: string | TranslatableMessage) => createAppError(RealtimeGatewayErrorTypeEnum.NOTIFICATION_NOT_FOUND, msg),
};
