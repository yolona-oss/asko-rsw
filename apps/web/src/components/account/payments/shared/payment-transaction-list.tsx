'use client';

import { Badge } from '@asko/ui';
import { formatDateTime, formatAmount } from '@asko/shared/client';
import type { PaymentRecord } from '@/lib/api/types';
import {
  PAYMENT_STATUS_VARIANT,
  PAYMENT_STATUS_LABELS_USER,
} from './payment-constants';

/**
 * Renders a list of payment transactions with date, amount, refund info, and status badge.
 * Optional `statusLabels` override for manager views.
 * Optional `onPaymentClick` makes rows clickable.
 */
export function PaymentTransactionList({
  payments,
  statusLabels,
  onPaymentClick,
}: {
  payments: PaymentRecord[];
  statusLabels?: Record<string, string>;
  onPaymentClick?: (payment: PaymentRecord) => void;
}) {
  const labels = statusLabels ?? PAYMENT_STATUS_LABELS_USER;

  return (
    <div className="flex flex-col gap-1">
      {payments.map((p) => (
        <div
          key={p.id}
          onClick={onPaymentClick ? () => onPaymentClick(p) : undefined}
          className={`flex items-center justify-between gap-2 py-1.5 border-b border-border-light last:border-b-0${
            onPaymentClick ? ' cursor-pointer hover:bg-surface-hover transition-colors' : ''
          }`}
        >
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-sm text-text-main">
              {formatDateTime(p.paidAt || p.createdAt)}
            </span>
            {(p.refundedAmount ?? 0) > 0 && (
              <span className="text-xs text-error">
                возврат {formatAmount(p.refundedAmount!)} ₽
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-sm font-medium text-text-main">
              {formatAmount(p.amount)} ₽
            </span>
            <Badge variant={PAYMENT_STATUS_VARIANT[p.status] ?? 'neutral'}>
              {labels[p.status] ?? p.status}
            </Badge>
          </div>
        </div>
      ))}
    </div>
  );
}
