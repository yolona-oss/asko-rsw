import { AppErrors as BaseAppErrors, createAppError } from '@asko/shared';
import type { TranslatableMessage } from '@asko/shared';
import { PaymentErrorTypeEnum } from './error-type.enum';

export { createAppError } from '@asko/shared';

export const AppErrors = {
    ...BaseAppErrors,

    // --- Payment ---
    paymentFailed: (msg?: string | TranslatableMessage) => createAppError(PaymentErrorTypeEnum.PAYMENT_FAILED, msg),
    paymentDeclined: (msg?: string | TranslatableMessage) => createAppError(PaymentErrorTypeEnum.PAYMENT_DECLINED, msg),
    paymentNotFound: (msg?: string | TranslatableMessage) => createAppError(PaymentErrorTypeEnum.PAYMENT_NOT_FOUND, msg),
    paymentAlreadyProcessed: (msg?: string | TranslatableMessage) => createAppError(PaymentErrorTypeEnum.PAYMENT_ALREADY_PROCESSED, msg),
};
