jest.mock('common/error', () => ({
    AppErrors: {
        badRequest: (msg: string) => new Error(msg),
    },
}));

jest.mock('@asko/shared', () => ({
    PaymentStatus: {
        PENDING: 'PENDING',
        PAID: 'PAID',
        FAILED: 'FAILED',
        REFUNDED: 'REFUNDED',
    },
}));

import { PaymentDomainService } from './payment-domain.service';
import { PaymentStatus } from '@asko/shared';

describe('PaymentDomainService', () => {
    let service: PaymentDomainService;

    beforeEach(() => {
        service = new PaymentDomainService(null as any);
    });

    describe('canTransition', () => {
        it('should return true for PENDING -> PAID', () => {
            expect(service.canTransition(PaymentStatus.PENDING, PaymentStatus.PAID)).toBe(true);
        });

        it('should return true for PENDING -> FAILED', () => {
            expect(service.canTransition(PaymentStatus.PENDING, PaymentStatus.FAILED)).toBe(true);
        });

        it('should return false for PENDING -> REFUNDED', () => {
            expect(service.canTransition(PaymentStatus.PENDING, PaymentStatus.REFUNDED)).toBe(false);
        });

        it('should return true for PAID -> REFUNDED', () => {
            expect(service.canTransition(PaymentStatus.PAID, PaymentStatus.REFUNDED)).toBe(true);
        });

        it('should return false for PAID -> PENDING', () => {
            expect(service.canTransition(PaymentStatus.PAID, PaymentStatus.PENDING)).toBe(false);
        });

        it('should return false for REFUNDED -> any status', () => {
            expect(service.canTransition(PaymentStatus.REFUNDED, PaymentStatus.PENDING)).toBe(false);
            expect(service.canTransition(PaymentStatus.REFUNDED, PaymentStatus.PAID)).toBe(false);
            expect(service.canTransition(PaymentStatus.REFUNDED, PaymentStatus.FAILED)).toBe(false);
            expect(service.canTransition(PaymentStatus.REFUNDED, PaymentStatus.REFUNDED)).toBe(false);
        });

        it('should return false for FAILED -> any status', () => {
            expect(service.canTransition(PaymentStatus.FAILED, PaymentStatus.PENDING)).toBe(false);
            expect(service.canTransition(PaymentStatus.FAILED, PaymentStatus.PAID)).toBe(false);
            expect(service.canTransition(PaymentStatus.FAILED, PaymentStatus.FAILED)).toBe(false);
            expect(service.canTransition(PaymentStatus.FAILED, PaymentStatus.REFUNDED)).toBe(false);
        });

        it('should return false for an unknown source status', () => {
            expect(service.canTransition('UNKNOWN' as PaymentStatus, PaymentStatus.PAID)).toBe(false);
        });
    });

    describe('assertTransition', () => {
        it('should not throw for valid transition PENDING -> PAID', () => {
            expect(() => service.assertTransition(PaymentStatus.PENDING, PaymentStatus.PAID)).not.toThrow();
        });

        it('should not throw for valid transition PENDING -> FAILED', () => {
            expect(() => service.assertTransition(PaymentStatus.PENDING, PaymentStatus.FAILED)).not.toThrow();
        });

        it('should not throw for valid transition PAID -> REFUNDED', () => {
            expect(() => service.assertTransition(PaymentStatus.PAID, PaymentStatus.REFUNDED)).not.toThrow();
        });

        it('should throw for invalid transition PENDING -> REFUNDED', () => {
            expect(() => service.assertTransition(PaymentStatus.PENDING, PaymentStatus.REFUNDED)).toThrow(
                'Invalid payment status transition: PENDING -> REFUNDED',
            );
        });

        it('should throw for invalid transition PAID -> PENDING', () => {
            expect(() => service.assertTransition(PaymentStatus.PAID, PaymentStatus.PENDING)).toThrow(
                'Invalid payment status transition: PAID -> PENDING',
            );
        });

        it('should throw for invalid transition REFUNDED -> PAID', () => {
            expect(() => service.assertTransition(PaymentStatus.REFUNDED, PaymentStatus.PAID)).toThrow(
                'Invalid payment status transition: REFUNDED -> PAID',
            );
        });

        it('should throw for invalid transition FAILED -> PENDING', () => {
            expect(() => service.assertTransition(PaymentStatus.FAILED, PaymentStatus.PENDING)).toThrow(
                'Invalid payment status transition: FAILED -> PENDING',
            );
        });
    });
});
