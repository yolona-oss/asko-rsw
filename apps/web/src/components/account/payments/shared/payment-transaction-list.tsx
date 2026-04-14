'use client';

import { Badge } from '@asko/ui';
import {
  PAYMENT_STATUS_VARIANT,
  PAYMENT_STATUS_LABELS_USER,
  formatPaymentDate,
  formatPaymentAmount,
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
  payments: any[];
  statusLabels?: Record<string, string>;
  onPaymentClick?: (payment: any) => void;
}) {
  const labels = statusLabels ?? PAYMENT_STATUS_LABELS_USER;

  return (
    <div className="flex flex-col gap-1">
      {payments.map((p: any) => (
        <div
          key={p.id}
          onClick={onPaymentClick ? () => onPaymentClick(p) : undefined}
          className={`flex items-center justify-between gap-2 py-1.5 border-b border-border-light last:border-b-0${
            onPaymentClick ? ' cursor-pointer hover:bg-surface-hover transition-colors' : ''
          }`}
        >
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-sm text-text-main">
              {formatPaymentDate(p.paidAt ?? p.createdAt)}
            </span>
            {p.refundedAmount > 0 && (
              <span className="text-xs text-error">
                возврат {formatPaymentAmount(p.refundedAmount)} ₽
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-sm font-medium text-text-main">
              {formatPaymentAmount(p.amount)} ₽
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
