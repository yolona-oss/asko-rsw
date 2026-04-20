'use client';

import { Badge, Card } from '@asko/ui';
import type { PaymentRecord } from '@/lib/api/types';
import { formatDateTime, formatAmount } from '@asko/shared/client';
import { STATUS_LABELS, STATUS_BADGE_VARIANT, TARGET_LABELS } from './constants';

export function PaymentCards({
  payments,
}: {
  payments: PaymentRecord[];
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {payments.map((p) => (
        <Card key={p.id} padding="none" className="p-5 flex flex-col gap-3">
          <div className="flex items-start justify-between gap-2">
            <p className="text-base font-medium text-text-main">
              {TARGET_LABELS[p.targetType ?? ''] ?? 'Заявка на ремонт'}
            </p>
            <Badge variant={STATUS_BADGE_VARIANT[p.status] ?? 'neutral'}>
              {STATUS_LABELS[p.status] ?? p.status}
            </Badge>
          </div>
          <span className="text-lg font-bold text-text-main">{formatAmount(p.amount)} ₽</span>
          <p className="text-sm text-text-sub">{formatDateTime(p.paidAt || p.createdAt)}</p>
        </Card>
      ))}
    </div>
  );
}
