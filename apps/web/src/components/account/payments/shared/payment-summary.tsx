'use client';

import { formatAmount } from '@asko/shared/client';
import { computePaymentTotals } from './payment-constants';

/**
 * Compact one-line summary of payment totals: Оплачено / Возвращено / Ожидает.
 * Accepts a raw payments array (any shape with `status`, `amount`, `refundedAmount`).
 */
export function PaymentSummary({ payments, className }: { payments: any[]; className?: string }) {
  const { effectivePaid, refunded, pending } = computePaymentTotals(payments);

  if (effectivePaid <= 0 && refunded <= 0 && pending <= 0) return null;

  return (
    <div className={`flex flex-wrap gap-x-6 gap-y-1 text-sm ${className ?? ''}`}>
      {effectivePaid > 0 && (
        <span className="text-text-main">
          Оплачено: <span className="font-medium">{formatAmount(effectivePaid)} ₽</span>
        </span>
      )}
      {refunded > 0 && (
        <span className="text-error">
          Возвращено: <span className="font-medium">{formatAmount(refunded)} ₽</span>
        </span>
      )}
      {pending > 0 && (
        <span className="text-warning">
          Ожидает: <span className="font-medium">{formatAmount(pending)} ₽</span>
        </span>
      )}
    </div>
  );
}
