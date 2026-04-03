'use client';

import {
  Badge,
  DataGrid,
} from '@asko/ui';
import type { DataGridColumn } from '@asko/ui';
import type { PaymentRecord } from '@/lib/api/payment';
import { STATUS_LABELS, STATUS_BADGE_VARIANT, TARGET_LABELS, formatDate, formatAmount } from './constants';

const columns: DataGridColumn<PaymentRecord>[] = [
  {
    key: 'type',
    header: 'Тип',
    mobileLabel: 'Тип:',
    render: (p) => (
      <p className="text-sm font-medium text-text-main">
        {TARGET_LABELS[p.targetType ?? ''] ?? 'Заявка на ремонт'}
      </p>
    ),
  },
  {
    key: 'amount',
    header: 'Сумма',
    width: 140,
    mobileLabel: 'Сумма:',
    render: (p) => (
      <p className="text-sm font-bold text-text-main">{formatAmount(p.amount)} ₽</p>
    ),
  },
  {
    key: 'status',
    header: 'Статус',
    width: 140,
    mobileLabel: 'Статус:',
    render: (p) => (
      <Badge variant={STATUS_BADGE_VARIANT[p.status] ?? 'neutral'}>
        {STATUS_LABELS[p.status] ?? p.status}
      </Badge>
    ),
  },
  {
    key: 'date',
    header: 'Дата',
    width: 160,
    mobileLabel: 'Дата:',
    render: (p) => (
      <p className="text-sm text-text-sub">{formatDate(p.paidAt ?? p.createdAt)}</p>
    ),
  },
];

export function PaymentTable({
  payments,
  totalCount,
}: {
  payments: PaymentRecord[];
  totalCount?: number;
}) {
  return (
    <DataGrid
      columns={columns}
      data={payments}
      keyExtractor={(p) => p.id}
      footer={<>Показано {payments.length} из {totalCount ?? payments.length}</>}
    />
  );
}
