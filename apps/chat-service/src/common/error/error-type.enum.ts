export { AppErrorTypeEnum } from '@asko/shared';

// Domain-specific chat error codes (range 1200+)
export enum ChatErrorTypeEnum {
    CONVERSATION_NOT_FOUND = 1200,
    MESSAGE_NOT_FOUND,
    PARTICIPANT_NOT_FOUND,
    ALREADY_PARTICIPANT,
    NOT_PARTICIPANT,
    CANNOT_DELETE_CONVERSATION,
    DIRECT_CONVERSATION_EXISTS,
    CONVERSATION_CLOSED,
}
