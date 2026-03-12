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
    [AppErrorTypeEnum.INVALID_OBJECT_ID]: { httpStatus: HttpStatus.BAD_REQUEST, message: 'Invalid object ID' },
    [AppErrorTypeEnum.INVALID_RANGE]: { httpStatus: HttpStatus.BAD_REQUEST, message: 'Invalid range' },
    [AppErrorTypeEnum.INVALID_ORDER_STATUS]: { httpStatus: HttpStatus.BAD_REQUEST, message: 'Invalid order status transition' },

    [AppErrorTypeEnum.USER_NOT_FOUND]: { httpStatus: HttpStatus.NOT_FOUND, message: 'User not found' },
    [AppErrorTypeEnum.USER_ALREADY_EXISTS]: { httpStatus: HttpStatus.CONFLICT, message: 'User already exists' },
    [AppErrorTypeEnum.INVALID_CREDENTIALS]: { httpStatus: HttpStatus.UNAUTHORIZED, message: 'Invalid credentials' },
    [AppErrorTypeEnum.EMAIL_NOT_CONFIRMED]: { httpStatus: HttpStatus.FORBIDDEN, message: 'Email not confirmed' },
    [AppErrorTypeEnum.OTP_EXPIRED]: { httpStatus: HttpStatus.BAD_REQUEST, message: 'OTP expired' },
    [AppErrorTypeEnum.OTP_INVALID]: { httpStatus: HttpStatus.BAD_REQUEST, message: 'Invalid OTP' },
    [AppErrorTypeEnum.TOKEN_EXPIRED]: { httpStatus: HttpStatus.UNAUTHORIZED, message: 'Token expired' },
    [AppErrorTypeEnum.TOKEN_INVALID]: { httpStatus: HttpStatus.UNAUTHORIZED, message: 'Invalid token' },
    [AppErrorTypeEnum.TOO_MANY_REQUESTS]: { httpStatus: HttpStatus.TOO_MANY_REQUESTS, message: 'Too many requests' },

    [AppErrorTypeEnum.PRODUCT_NOT_FOUND]: { httpStatus: HttpStatus.NOT_FOUND, message: 'Product not found' },
    [AppErrorTypeEnum.INGREDIENT_NOT_FOUND]: { httpStatus: HttpStatus.NOT_FOUND, message: 'Ingredient not found' },
    [AppErrorTypeEnum.OUT_OF_STOCK]: { httpStatus: HttpStatus.BAD_REQUEST, message: 'Out of stock' },
    [AppErrorTypeEnum.INFINITE_STOCK_DISABLED]: { httpStatus: HttpStatus.BAD_REQUEST, message: 'Infinite stock disabled' },
    [AppErrorTypeEnum.CART_EMPTY]: { httpStatus: HttpStatus.BAD_REQUEST, message: 'Cart is empty' },
    [AppErrorTypeEnum.CART_RULE_INVALID]: { httpStatus: HttpStatus.BAD_REQUEST, message: 'Invalid cart rule' },

    [AppErrorTypeEnum.PAYMENT_FAILED]: { httpStatus: HttpStatus.BAD_REQUEST, message: 'Payment failed' },
    [AppErrorTypeEnum.PAYMENT_DECLINED]: { httpStatus: HttpStatus.BAD_REQUEST, message: 'Payment declined' },
    [AppErrorTypeEnum.PAYMENT_NOT_FOUND]: { httpStatus: HttpStatus.NOT_FOUND, message: 'Payment not found' },
    [AppErrorTypeEnum.PAYMENT_ALREADY_PROCESSED]: { httpStatus: HttpStatus.CONFLICT, message: 'Payment already processed' },

    [AppErrorTypeEnum.COURIER_NOT_AVAILABLE]: { httpStatus: HttpStatus.BAD_REQUEST, message: 'No courier available' },
    [AppErrorTypeEnum.DELIVERY_ZONE_NOT_FOUND]: { httpStatus: HttpStatus.NOT_FOUND, message: 'Delivery zone not found' },
    [AppErrorTypeEnum.ORDER_ALREADY_ASSIGNED]: { httpStatus: HttpStatus.CONFLICT, message: 'Order already assigned' },
    [AppErrorTypeEnum.ORDER_NOT_ASSIGNABLE]: { httpStatus: HttpStatus.BAD_REQUEST, message: 'Order not assignable' },

    [AppErrorTypeEnum.FILE_UPLOAD_FAILED]: { httpStatus: HttpStatus.INTERNAL_SERVER_ERROR, message: 'File upload failed' },
    [AppErrorTypeEnum.EXTERNAL_SERVICE_UNAVAILABLE]: { httpStatus: HttpStatus.SERVICE_UNAVAILABLE, message: 'External service unavailable' },
}
