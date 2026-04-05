import type { IErrorMessage } from '@asko/shared';
import { AppError } from '@asko/shared';
import { GatewayErrorTypeEnum } from './error-type.enum';

const GatewayErrorsDefinition: Record<number, IErrorMessage> = {
    [GatewayErrorTypeEnum.INVALID_OBJECT_ID]: { httpStatus: 400, message: 'Invalid object ID' },
    [GatewayErrorTypeEnum.INVALID_RANGE]: { httpStatus: 400, message: 'Invalid range' },
    [GatewayErrorTypeEnum.INVALID_ORDER_STATUS]: { httpStatus: 400, message: 'Invalid order status transition' },

    [GatewayErrorTypeEnum.USER_NOT_FOUND]: { httpStatus: 404, message: 'User not found' },
    [GatewayErrorTypeEnum.USER_ALREADY_EXISTS]: { httpStatus: 409, message: 'User already exists' },
    [GatewayErrorTypeEnum.INVALID_CREDENTIALS]: { httpStatus: 401, message: 'Invalid credentials' },
    [GatewayErrorTypeEnum.EMAIL_NOT_CONFIRMED]: { httpStatus: 403, message: 'Email not confirmed' },
    [GatewayErrorTypeEnum.OTP_EXPIRED]: { httpStatus: 400, message: 'OTP expired' },
    [GatewayErrorTypeEnum.OTP_INVALID]: { httpStatus: 400, message: 'Invalid OTP' },
    [GatewayErrorTypeEnum.TOKEN_EXPIRED]: { httpStatus: 401, message: 'Token expired' },
    [GatewayErrorTypeEnum.TOKEN_INVALID]: { httpStatus: 401, message: 'Invalid token' },
    [GatewayErrorTypeEnum.TOO_MANY_REQUESTS]: { httpStatus: 429, message: 'Too many requests' },

    [GatewayErrorTypeEnum.PRODUCT_NOT_FOUND]: { httpStatus: 404, message: 'Product not found' },
    [GatewayErrorTypeEnum.INGREDIENT_NOT_FOUND]: { httpStatus: 404, message: 'Ingredient not found' },
    [GatewayErrorTypeEnum.OUT_OF_STOCK]: { httpStatus: 400, message: 'Out of stock' },
    [GatewayErrorTypeEnum.INFINITE_STOCK_DISABLED]: { httpStatus: 400, message: 'Infinite stock disabled' },
    [GatewayErrorTypeEnum.CART_EMPTY]: { httpStatus: 400, message: 'Cart is empty' },
    [GatewayErrorTypeEnum.CART_RULE_INVALID]: { httpStatus: 400, message: 'Invalid cart rule' },

    [GatewayErrorTypeEnum.PAYMENT_FAILED]: { httpStatus: 400, message: 'Payment failed' },
    [GatewayErrorTypeEnum.PAYMENT_DECLINED]: { httpStatus: 400, message: 'Payment declined' },
    [GatewayErrorTypeEnum.PAYMENT_NOT_FOUND]: { httpStatus: 404, message: 'Payment not found' },
    [GatewayErrorTypeEnum.PAYMENT_ALREADY_PROCESSED]: { httpStatus: 409, message: 'Payment already processed' },

    [GatewayErrorTypeEnum.COURIER_NOT_AVAILABLE]: { httpStatus: 400, message: 'No courier available' },
    [GatewayErrorTypeEnum.DELIVERY_ZONE_NOT_FOUND]: { httpStatus: 404, message: 'Delivery zone not found' },
    [GatewayErrorTypeEnum.ORDER_ALREADY_ASSIGNED]: { httpStatus: 409, message: 'Order already assigned' },
    [GatewayErrorTypeEnum.ORDER_NOT_ASSIGNABLE]: { httpStatus: 400, message: 'Order not assignable' },

    [GatewayErrorTypeEnum.FILE_UPLOAD_FAILED]: { httpStatus: 500, message: 'File upload failed' },
    [GatewayErrorTypeEnum.EXTERNAL_SERVICE_UNAVAILABLE]: { httpStatus: 503, message: 'External service unavailable' },
};

AppError.registerDefinitions(GatewayErrorsDefinition);
