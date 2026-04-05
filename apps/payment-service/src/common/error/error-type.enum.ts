export { AppErrorTypeEnum } from '@asko/shared';

// Domain-specific payment error codes (range 1000+)
export enum PaymentErrorTypeEnum {
    PAYMENT_FAILED = 1000,
    PAYMENT_DECLINED,
    PAYMENT_NOT_FOUND,
    PAYMENT_ALREADY_PROCESSED,
}
