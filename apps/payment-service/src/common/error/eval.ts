import { AppErrors as BaseAppErrors, createAppError } from '@asko/shared';
import { PaymentErrorTypeEnum } from './error-type.enum';

export { createAppError } from '@asko/shared';

export const AppErrors = {
    ...BaseAppErrors,

    // --- Payment ---
    paymentFailed: (msg?: string) => createAppError(PaymentErrorTypeEnum.PAYMENT_FAILED, msg),
    paymentDeclined: (msg?: string) => createAppError(PaymentErrorTypeEnum.PAYMENT_DECLINED, msg),
    paymentNotFound: (msg?: string) => createAppError(PaymentErrorTypeEnum.PAYMENT_NOT_FOUND, msg),
    paymentAlreadyProcessed: (msg?: string) => createAppError(PaymentErrorTypeEnum.PAYMENT_ALREADY_PROCESSED, msg),
};
