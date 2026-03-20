import { AppErrorTypeEnum } from './error-type.enum';
import { IErrorMessage } from './ierror-message.interface';

export const ErrorsDefinition: Record<number, IErrorMessage> = {
    [AppErrorTypeEnum.BAD_REQUEST]: { httpStatus: 400, message: 'Bad request' },
    [AppErrorTypeEnum.UNAUTHORIZED]: { httpStatus: 401, message: 'Unauthorized' },
    [AppErrorTypeEnum.FORBIDDEN]: { httpStatus: 403, message: 'Access forbidden' },
    [AppErrorTypeEnum.NOT_FOUND]: { httpStatus: 404, message: 'Resource not found' },
    [AppErrorTypeEnum.CONFLICT]: { httpStatus: 409, message: 'Conflict detected' },
    [AppErrorTypeEnum.INTERNAL_ERROR]: { httpStatus: 500, message: 'Internal server error' },

    [AppErrorTypeEnum.DB_CANNOT_READ]: { httpStatus: 500, message: 'Cannot read from database' },
    [AppErrorTypeEnum.DB_CANNOT_CREATE]: { httpStatus: 500, message: 'Cannot create entity in database' },
    [AppErrorTypeEnum.DB_CANNOT_UPDATE]: { httpStatus: 500, message: 'Cannot update entity in database' },
    [AppErrorTypeEnum.DB_CANNOT_DELETE]: { httpStatus: 500, message: 'Cannot delete entity in database' },
    [AppErrorTypeEnum.DB_ENTITY_EXISTS]: { httpStatus: 409, message: 'Entity already exists' },
    [AppErrorTypeEnum.DB_ENTITY_NOT_FOUND]: { httpStatus: 404, message: 'Entity not found' },
    [AppErrorTypeEnum.DB_DUPLICATE_KEY]: { httpStatus: 409, message: 'Duplicate key error' },
    [AppErrorTypeEnum.DB_INCORRECT_MODEL]: { httpStatus: 400, message: 'Incorrect model definition' },

    [AppErrorTypeEnum.INVALID_DATA]: { httpStatus: 400, message: 'Invalid input data' },
    [AppErrorTypeEnum.VALIDATION_ERROR]: { httpStatus: 400, message: 'Validation error' },
    [AppErrorTypeEnum.INVALID_OBJECT_ID]: { httpStatus: 400, message: 'Invalid object ID' },
    [AppErrorTypeEnum.INVALID_RANGE]: { httpStatus: 400, message: 'Invalid range' },
    [AppErrorTypeEnum.INVALID_ORDER_STATUS]: { httpStatus: 400, message: 'Invalid order status transition' },

    [AppErrorTypeEnum.USER_NOT_FOUND]: { httpStatus: 404, message: 'User not found' },
    [AppErrorTypeEnum.USER_ALREADY_EXISTS]: { httpStatus: 409, message: 'User already exists' },
    [AppErrorTypeEnum.INVALID_CREDENTIALS]: { httpStatus: 401, message: 'Invalid credentials' },
    [AppErrorTypeEnum.EMAIL_NOT_CONFIRMED]: { httpStatus: 403, message: 'Email not confirmed' },
    [AppErrorTypeEnum.OTP_EXPIRED]: { httpStatus: 400, message: 'OTP expired' },
    [AppErrorTypeEnum.OTP_INVALID]: { httpStatus: 400, message: 'Invalid OTP' },
    [AppErrorTypeEnum.TOKEN_EXPIRED]: { httpStatus: 401, message: 'Token expired' },
    [AppErrorTypeEnum.TOKEN_INVALID]: { httpStatus: 401, message: 'Invalid token' },
    [AppErrorTypeEnum.TOO_MANY_REQUESTS]: { httpStatus: 429, message: 'Too many requests' },
};
