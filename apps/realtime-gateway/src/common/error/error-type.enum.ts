export { AppErrorTypeEnum } from '@asko/shared';

/**
 * Realtime-gateway-specific error codes.
 * Focused on chat + notification domain errors.
 */
export enum RealtimeGatewayErrorTypeEnum {
    // --- Auth (range 800+) ---
    TOKEN_EXPIRED = 806,
    TOKEN_INVALID = 807,

    // --- Chat (range 1300+) ---
    CONVERSATION_NOT_FOUND = 1300,
    MESSAGE_NOT_FOUND,
    CHAT_PRIVACY_DENIED,
    PARTICIPANT_NOT_IN_CONVERSATION,

    // --- Notification (range 1400+) ---
    NOTIFICATION_NOT_FOUND = 1400,
}
