import type { IErrorMessage } from '@asko/shared';
import { AppError } from '@asko/shared';
import { GatewayErrorTypeEnum } from './error-type.enum';

const GatewayErrorsDefinition: Record<number, IErrorMessage> = {
    [GatewayErrorTypeEnum.INVALID_OBJECT_ID]: { httpStatus: 400, message: 'Invalid object ID' },
    [GatewayErrorTypeEnum.INVALID_RANGE]: { httpStatus: 400, message: 'Invalid range' },
    [GatewayErrorTypeEnum.INVALID_ORDER_STATUS]: { httpStatus: 400, message: 'Invalid order status transition' },

    [GatewayErrorTypeEnum.PAYMENT_FAILED]: { httpStatus: 400, message: 'Payment failed' },
    [GatewayErrorTypeEnum.PAYMENT_DECLINED]: { httpStatus: 400, message: 'Payment declined' },
    [GatewayErrorTypeEnum.PAYMENT_NOT_FOUND]: { httpStatus: 404, message: 'Payment not found' },
    [GatewayErrorTypeEnum.PAYMENT_ALREADY_PROCESSED]: { httpStatus: 409, message: 'Payment already processed' },

    [GatewayErrorTypeEnum.REPAIR_NOT_FOUND]: { httpStatus: 404, message: 'Repair request not found' },
    [GatewayErrorTypeEnum.REPAIR_INVALID_STATUS]: { httpStatus: 400, message: 'Invalid repair status transition' },
    [GatewayErrorTypeEnum.DEVICE_NOT_FOUND]: { httpStatus: 404, message: 'Device not found' },
    [GatewayErrorTypeEnum.CERTIFICATE_NOT_FOUND]: { httpStatus: 404, message: 'Certificate not found' },
    [GatewayErrorTypeEnum.REPAIRER_NOT_FOUND]: { httpStatus: 404, message: 'Repairer not found' },

    [GatewayErrorTypeEnum.FILE_UPLOAD_FAILED]: { httpStatus: 500, message: 'File upload failed' },
    [GatewayErrorTypeEnum.EXTERNAL_SERVICE_UNAVAILABLE]: { httpStatus: 503, message: 'External service unavailable' },
};

AppError.registerDefinitions(GatewayErrorsDefinition);
