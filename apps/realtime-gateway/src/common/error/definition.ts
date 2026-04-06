import type { IErrorMessage } from '@asko/shared';
import { AppError } from '@asko/shared';
import { RealtimeGatewayErrorTypeEnum } from './error-type.enum';

const RealtimeGatewayErrorsDefinition: Record<number, IErrorMessage> = {
    [RealtimeGatewayErrorTypeEnum.TOKEN_EXPIRED]: { httpStatus: 401, message: 'Token expired' },
    [RealtimeGatewayErrorTypeEnum.TOKEN_INVALID]: { httpStatus: 401, message: 'Invalid token' },

    [RealtimeGatewayErrorTypeEnum.CONVERSATION_NOT_FOUND]: { httpStatus: 404, message: 'Conversation not found' },
    [RealtimeGatewayErrorTypeEnum.MESSAGE_NOT_FOUND]: { httpStatus: 404, message: 'Message not found' },
    [RealtimeGatewayErrorTypeEnum.CHAT_PRIVACY_DENIED]: { httpStatus: 403, message: 'Chat privacy denied' },
    [RealtimeGatewayErrorTypeEnum.PARTICIPANT_NOT_IN_CONVERSATION]: { httpStatus: 403, message: 'Not a participant in this conversation' },

    [RealtimeGatewayErrorTypeEnum.NOTIFICATION_NOT_FOUND]: { httpStatus: 404, message: 'Notification not found' },
};

AppError.registerDefinitions(RealtimeGatewayErrorsDefinition);
