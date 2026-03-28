import { HttpStatus } from '@nestjs/common';
import { AppErrorTypeEnum } from './error-type.enum';
import { IErrorMessage } from './ierror-message.interface';

export const ErrorsDefinition: Record<AppErrorTypeEnum, IErrorMessage> = {
    [AppErrorTypeEnum.BAD_REQUEST]: { httpStatus: HttpStatus.BAD_REQUEST, message: 'Bad request' },
    [AppErrorTypeEnum.UNAUTHORIZED]: { httpStatus: HttpStatus.UNAUTHORIZED, message: 'Unauthorized' },
    [AppErrorTypeEnum.FORBIDDEN]: { httpStatus: HttpStatus.FORBIDDEN, message: 'Access forbidden' },
    [AppErrorTypeEnum.NOT_FOUND]: { httpStatus: HttpStatus.NOT_FOUND, message: 'Resource not found' },
    [AppErrorTypeEnum.CONFLICT]: { httpStatus: HttpStatus.CONFLICT, message: 'Conflict detected' },
    [AppErrorTypeEnum.INTERNAL_ERROR]: { httpStatus: HttpStatus.INTERNAL_SERVER_ERROR, message: 'Internal server error' },

    [AppErrorTypeEnum.DB_CANNOT_READ]: { httpStatus: HttpStatus.INTERNAL_SERVER_ERROR, message: 'Cannot read from database' },
    [AppErrorTypeEnum.DB_CANNOT_CREATE]: { httpStatus: HttpStatus.INTERNAL_SERVER_ERROR, message: 'Cannot create entity in database' },
    [AppErrorTypeEnum.DB_CANNOT_UPDATE]: { httpStatus: HttpStatus.INTERNAL_SERVER_ERROR, message: 'Cannot update entity in database' },
    [AppErrorTypeEnum.DB_CANNOT_DELETE]: { httpStatus: HttpStatus.INTERNAL_SERVER_ERROR, message: 'Cannot delete entity in database' },
    [AppErrorTypeEnum.DB_ENTITY_EXISTS]: { httpStatus: HttpStatus.CONFLICT, message: 'Entity already exists' },
    [AppErrorTypeEnum.DB_ENTITY_NOT_FOUND]: { httpStatus: HttpStatus.NOT_FOUND, message: 'Entity not found' },
    [AppErrorTypeEnum.DB_DUPLICATE_KEY]: { httpStatus: HttpStatus.CONFLICT, message: 'Duplicate key error' },
    [AppErrorTypeEnum.DB_INCORRECT_MODEL]: { httpStatus: HttpStatus.BAD_REQUEST, message: 'Incorrect model definition' },

    [AppErrorTypeEnum.INVALID_DATA]: { httpStatus: HttpStatus.BAD_REQUEST, message: 'Invalid input data' },
    [AppErrorTypeEnum.VALIDATION_ERROR]: { httpStatus: HttpStatus.BAD_REQUEST, message: 'Validation error' },

    [AppErrorTypeEnum.ARTICLE_NOT_FOUND]: { httpStatus: HttpStatus.NOT_FOUND, message: 'Article not found' },
};
