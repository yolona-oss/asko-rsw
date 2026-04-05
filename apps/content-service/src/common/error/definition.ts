import type { IErrorMessage } from '@asko/shared';
import { AppError } from '@asko/shared';
import { ContentErrorTypeEnum } from './error-type.enum';

const ContentErrorsDefinition: Record<number, IErrorMessage> = {
    [ContentErrorTypeEnum.ARTICLE_NOT_FOUND]: { httpStatus: 404, message: 'Article not found' },
};

AppError.registerDefinitions(ContentErrorsDefinition);
