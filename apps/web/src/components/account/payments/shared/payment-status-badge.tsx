'use client';

import { Badge } from '@asko/ui';
import type { BadgeVariant } from '@asko/ui';
import { formatAmount } from '@asko/shared/client';
import { computePaymentTotals } from './payment-constants';

export interface PaymentSummaryInfo {
  paid: number;
  pending: number;
  refunded: number;
  label: string;
  variant: BadgeVariant;
}

/**
 * Computes a payment summary from an array of payment records.
 * Returns label + badge variant + amounts.
 */
export function getPaymentSummaryInfo(payments: any[]): PaymentSummaryInfo | null {
  if (!payments || payments.length === 0) return null;

  const { effectivePaid, pending, refunded } = computePaymentTotals(payments);

  if (effectivePaid <= 0 && pending <= 0 && refunded <= 0) return null;

  if (refunded > 0 && effectivePaid <= 0 && pending <= 0) {
    return { paid: 0, pending: 0, refunded, label: 'Возвращена', variant: 'error' };
  }
  if (pending > 0 && effectivePaid <= 0) {
    return { paid: 0, pending, refunded, label: 'Ожидает оплаты', variant: 'warning' };
  }
  if (effectivePaid > 0 && pending > 0) {
    return { paid: effectivePaid, pending, refunded, label: 'Частично оплачена', variant: 'warning' };
  }
  if (effectivePaid > 0 && refunded > 0) {
    return { paid: effectivePaid, pending: 0, refunded, label: 'Частичный возврат', variant: 'warning' };
  }
  if (effectivePaid > 0) {
    return { paid: effectivePaid, pending: 0, refunded: 0, label: 'Оплачена', variant: 'success' };
  }

  return null;
}

/**
 * Compact payment status badge for list/card views.
 * Pass the payments array fetched for this repair request.
 */
export function PaymentStatusBadge({
  payments,
  showAmount,
  className,
}: {
  payments: any[] | undefined;
  showAmount?: boolean;
  className?: string;
}) {
  if (!payments) return null;
  const info = getPaymentSummaryInfo(payments);
  if (!info) return null;

  return (
    <span className={`inline-flex items-center gap-1.5 ${className ?? ''}`}>
      {showAmount && info.paid > 0 && (
        <span className="text-sm text-text-main">{formatAmount(info.paid)} ₽</span>
      )}
      <Badge variant={info.variant} className="text-xs">
        {info.label}
      </Badge>
    </span>
  );
}
