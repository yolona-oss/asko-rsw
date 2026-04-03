'use client';

import { Badge, Card } from '@asko/ui';
import { WITHDRAW_STATUS_LABELS, WITHDRAW_BADGE_VARIANT, formatDate, formatAmount } from './constants';

interface Withdrawal {
  id: string;
  amount: number;
  requestedAt: Date | string;
  status: string;
}

export function WithdrawalHistory({
  withdrawals,
}: {
  withdrawals: Withdrawal[];
}) {
  if (withdrawals.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-lg font-medium text-text-main">Запросы на вывод</h3>
      {withdrawals.map((w) => (
        <Card key={w.id} className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-base font-medium text-text-main">{formatAmount(w.amount)} баллов</span>
            <span className="text-sm text-text-sub">{formatDate(w.requestedAt)}</span>
          </div>
          <Badge variant={WITHDRAW_BADGE_VARIANT[w.status] ?? 'neutral'}>
            {WITHDRAW_STATUS_LABELS[w.status] ?? w.status}
          </Badge>
        </Card>
      ))}
    </div>
  );
}
