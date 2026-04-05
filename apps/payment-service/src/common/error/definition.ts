import type { IErrorMessage } from '@asko/shared';
import { AppError } from '@asko/shared';
import { PaymentErrorTypeEnum } from './error-type.enum';

const PaymentErrorsDefinition: Record<number, IErrorMessage> = {
    [PaymentErrorTypeEnum.PAYMENT_FAILED]: { httpStatus: 400, message: 'Payment failed' },
    [PaymentErrorTypeEnum.PAYMENT_DECLINED]: { httpStatus: 400, message: 'Payment declined' },
    [PaymentErrorTypeEnum.PAYMENT_NOT_FOUND]: { httpStatus: 404, message: 'Payment not found' },
    [PaymentErrorTypeEnum.PAYMENT_ALREADY_PROCESSED]: { httpStatus: 409, message: 'Payment already processed' },
};

AppError.registerDefinitions(PaymentErrorsDefinition);
