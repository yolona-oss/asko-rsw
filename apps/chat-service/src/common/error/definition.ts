import type { IErrorMessage } from '@asko/shared';
import { AppError } from '@asko/shared';
import { ChatErrorTypeEnum } from './error-type.enum';

const ChatErrorsDefinition: Record<number, IErrorMessage> = {
    [ChatErrorTypeEnum.CONVERSATION_NOT_FOUND]: { httpStatus: 404, message: 'Conversation not found' },
    [ChatErrorTypeEnum.MESSAGE_NOT_FOUND]: { httpStatus: 404, message: 'Message not found' },
    [ChatErrorTypeEnum.PARTICIPANT_NOT_FOUND]: { httpStatus: 404, message: 'Participant not found' },
    [ChatErrorTypeEnum.ALREADY_PARTICIPANT]: { httpStatus: 409, message: 'User is already a participant' },
    [ChatErrorTypeEnum.NOT_PARTICIPANT]: { httpStatus: 403, message: 'User is not a participant of this conversation' },
    [ChatErrorTypeEnum.CANNOT_DELETE_CONVERSATION]: { httpStatus: 403, message: 'Only the creator can delete a conversation' },
    [ChatErrorTypeEnum.DIRECT_CONVERSATION_EXISTS]: { httpStatus: 409, message: 'Direct conversation already exists between these users' },
    [ChatErrorTypeEnum.CONVERSATION_CLOSED]: { httpStatus: 400, message: 'Conversation is closed' },
};

AppError.registerDefinitions(ChatErrorsDefinition);
