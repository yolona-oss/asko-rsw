import type { IErrorMessage } from '@asko/shared';
import { AppError } from '@asko/shared';
import { NotificationErrorTypeEnum } from './error-type.enum';

const NotificationErrorsDefinition: Record<number, IErrorMessage> = {
    [NotificationErrorTypeEnum.NOTIFICATION_NOT_FOUND]: { httpStatus: 404, message: 'Notification not found' },
};

AppError.registerDefinitions(NotificationErrorsDefinition);
