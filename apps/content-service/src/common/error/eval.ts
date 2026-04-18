import { AppErrors as BaseAppErrors, createAppError } from '@asko/shared';
import type { TranslatableMessage } from '@asko/shared';
import { ContentErrorTypeEnum } from './error-type.enum';

export { createAppError } from '@asko/shared';

export const AppErrors = {
    ...BaseAppErrors,

    // --- Content ---
    articleNotFound: (msg?: string | TranslatableMessage) => createAppError(ContentErrorTypeEnum.ARTICLE_NOT_FOUND, msg),
};
