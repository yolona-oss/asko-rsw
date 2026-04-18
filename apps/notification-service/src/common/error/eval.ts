import { AppErrors as BaseAppErrors, createAppError } from '@asko/shared';
import type { TranslatableMessage } from '@asko/shared';
import { NotificationErrorTypeEnum } from './error-type.enum';

export { createAppError } from '@asko/shared';

export const AppErrors = {
    ...BaseAppErrors,

    // --- Notification ---
    notificationNotFound: (msg?: string | TranslatableMessage) => createAppError(NotificationErrorTypeEnum.NOTIFICATION_NOT_FOUND, msg),
};
