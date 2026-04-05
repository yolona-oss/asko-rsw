import type { IErrorMessage } from '@asko/shared';
import { AppError } from '@asko/shared';
import { UserErrorTypeEnum } from './error-type.enum';

const UserErrorsDefinition: Record<number, IErrorMessage> = {
    [UserErrorTypeEnum.INVALID_OBJECT_ID]: { httpStatus: 400, message: 'Invalid object ID' },
    [UserErrorTypeEnum.INVALID_RANGE]: { httpStatus: 400, message: 'Invalid range' },
    [UserErrorTypeEnum.INVALID_ORDER_STATUS]: { httpStatus: 400, message: 'Invalid order status transition' },

    [UserErrorTypeEnum.USER_NOT_FOUND]: { httpStatus: 404, message: 'User not found' },
    [UserErrorTypeEnum.USER_ALREADY_EXISTS]: { httpStatus: 409, message: 'User already exists' },
    [UserErrorTypeEnum.INVALID_CREDENTIALS]: { httpStatus: 401, message: 'Invalid credentials' },
    [UserErrorTypeEnum.EMAIL_NOT_CONFIRMED]: { httpStatus: 403, message: 'Email not confirmed' },
    [UserErrorTypeEnum.OTP_EXPIRED]: { httpStatus: 400, message: 'OTP expired' },
    [UserErrorTypeEnum.OTP_INVALID]: { httpStatus: 400, message: 'Invalid OTP' },
    [UserErrorTypeEnum.TOKEN_EXPIRED]: { httpStatus: 401, message: 'Token expired' },
    [UserErrorTypeEnum.TOKEN_INVALID]: { httpStatus: 401, message: 'Invalid token' },
    [UserErrorTypeEnum.TOO_MANY_REQUESTS]: { httpStatus: 429, message: 'Too many requests' },
};

AppError.registerDefinitions(UserErrorsDefinition);
