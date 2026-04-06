import type { IErrorMessage } from '@asko/shared';
import { AppError } from '@asko/shared';
import { GatewayErrorTypeEnum } from './error-type.enum';

const GatewayErrorsDefinition: Record<number, IErrorMessage> = {
    [GatewayErrorTypeEnum.INVALID_OBJECT_ID]: { httpStatus: 400, message: 'Invalid object ID' },
    [GatewayErrorTypeEnum.INVALID_RANGE]: { httpStatus: 400, message: 'Invalid range' },

    [GatewayErrorTypeEnum.USER_NOT_FOUND]: { httpStatus: 404, message: 'User not found' },
    [GatewayErrorTypeEnum.USER_ALREADY_EXISTS]: { httpStatus: 409, message: 'User already exists' },
    [GatewayErrorTypeEnum.INVALID_CREDENTIALS]: { httpStatus: 401, message: 'Invalid credentials' },
    [GatewayErrorTypeEnum.EMAIL_NOT_CONFIRMED]: { httpStatus: 403, message: 'Email not confirmed' },
    [GatewayErrorTypeEnum.TOKEN_EXPIRED]: { httpStatus: 401, message: 'Token expired' },
    [GatewayErrorTypeEnum.TOKEN_INVALID]: { httpStatus: 401, message: 'Invalid token' },

    [GatewayErrorTypeEnum.FILE_UPLOAD_FAILED]: { httpStatus: 500, message: 'File upload failed' },
    [GatewayErrorTypeEnum.EXTERNAL_SERVICE_UNAVAILABLE]: { httpStatus: 503, message: 'External service unavailable' },
};

AppError.registerDefinitions(GatewayErrorsDefinition);
