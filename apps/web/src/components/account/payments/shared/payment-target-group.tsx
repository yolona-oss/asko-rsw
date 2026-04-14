'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Card, Badge } from '@asko/ui';
import { PAYMENT_TARGET_LABELS } from './payment-constants';
import { PaymentSummary } from './payment-summary';
import { PaymentTransactionList } from './payment-transaction-list';

interface PaymentTargetGroupProps {
  groupKey: string;
  payments: any[];
  statusLabels?: Record<string, string>;
  onPaymentClick?: (payment: any, allGroupPayments: any[]) => void;
}

export function PaymentTargetGroup({
  groupKey,
  payments,
  statusLabels,
  onPaymentClick,
}: PaymentTargetGroupProps) {
  const [expanded, setExpanded] = useState(false);

  const colonIdx = groupKey.indexOf(':');
  const targetType = colonIdx > 0 ? groupKey.slice(0, colonIdx) : '';
  const targetId = colonIdx > 0 ? groupKey.slice(colonIdx + 1) : '';
  const isUnknown = groupKey === 'unknown' || !targetType;

  const typeLabel = isUnknown
    ? 'Прочие платежи'
    : (PAYMENT_TARGET_LABELS[targetType] ?? targetType);

  return (
    <Card padding="none" className="flex flex-col">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left cursor-pointer hover:bg-surface-hover transition-colors"
      >
        {expanded
          ? <ChevronDown className="w-4 h-4 text-text-sub flex-shrink-0" />
          : <ChevronRight className="w-4 h-4 text-text-sub flex-shrink-0" />
        }
        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 flex-1 min-w-0">
          <span className="text-sm font-medium text-text-main">{typeLabel}</span>
          {!isUnknown && (
            <span className="text-xs text-text-sub font-mono">#{targetId.slice(0, 8)}</span>
          )}
        </div>
        <Badge variant="neutral" className="text-xs flex-shrink-0">{payments.length}</Badge>
        <div className="hidden sm:block flex-shrink-0">
          <PaymentSummary payments={payments} />
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border-light px-4 py-3">
          <div className="sm:hidden mb-3">
            <PaymentSummary payments={payments} />
          </div>
          <PaymentTransactionList
            payments={payments}
            statusLabels={statusLabels}
            onPaymentClick={onPaymentClick ? (p) => onPaymentClick(p, payments) : undefined}
          />
        </div>
      )}
    </Card>
  );
}
