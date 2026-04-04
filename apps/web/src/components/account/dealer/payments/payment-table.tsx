'use client';

import { useState, useMemo } from 'react';
import {
  Badge,
  DataGrid,
} from '@asko/ui';
import type { DataGridColumn, SortOrder } from '@asko/ui';
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
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder | null>(null);

  const sortedPayments = useMemo(() => {
    if (!sortBy) return payments;
    return [...payments].sort((a, b) => {
      const av = (a as any)[sortBy] ?? '';
      const bv = (b as any)[sortBy] ?? '';
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return sortOrder === 'desc' ? -cmp : cmp;
    });
  }, [payments, sortBy, sortOrder]);

  return (
    <DataGrid
      columns={columns}
      data={sortedPayments}
      keyExtractor={(p) => p.id}
      sortKey={sortBy ?? undefined}
      sortOrder={sortOrder ?? undefined}
      onSort={(key, order) => { setSortBy(key); setSortOrder(order); }}
      footer={<>Показано {payments.length} из {totalCount ?? payments.length}</>}
    />
  );
}
