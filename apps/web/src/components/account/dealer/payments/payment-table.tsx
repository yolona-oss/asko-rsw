'use client';

import {
  Badge,
  DataTable,
  DataTableHeader,
  DataTableRow,
  DataTableCell,
  DataTableFooter,
} from '@asko/ui';
import type { PaymentRecord } from '@/lib/api/payment';
import { STATUS_LABELS, STATUS_BADGE_VARIANT, TARGET_LABELS, formatDate, formatAmount } from './constants';

export function PaymentTable({
  payments,
}: {
  payments: PaymentRecord[];
}) {
  return (
    <DataTable>
      <DataTableHeader>
        <div className="flex-1">Тип</div>
        <div className="w-[140px] px-4">Сумма</div>
        <div className="w-[140px] px-4">Статус</div>
        <div className="w-[160px] px-4">Дата</div>
      </DataTableHeader>

      {payments.map((p) => (
        <DataTableRow key={p.id}>
          <DataTableCell mobileLabel="Тип:" className="lg:flex-1">
            <p className="text-sm font-medium text-text-main">
              {TARGET_LABELS[p.targetType ?? ''] ?? 'Заявка на ремонт'}
            </p>
          </DataTableCell>
          <DataTableCell mobileLabel="Сумма:" className="lg:w-[140px] lg:px-4">
            <p className="text-sm font-bold text-text-main">{formatAmount(p.amount)} ₽</p>
          </DataTableCell>
          <DataTableCell mobileLabel="Статус:" className="lg:w-[140px] lg:px-4">
            <Badge variant={STATUS_BADGE_VARIANT[p.status] ?? 'neutral'}>
              {STATUS_LABELS[p.status] ?? p.status}
            </Badge>
          </DataTableCell>
          <DataTableCell mobileLabel="Дата:" className="lg:w-[160px] lg:px-4">
            <p className="text-sm text-text-sub">{formatDate(p.paidAt ?? p.createdAt)}</p>
          </DataTableCell>
        </DataTableRow>
      ))}

      <DataTableFooter>
        Показано {payments.length} из {payments.length}
      </DataTableFooter>
    </DataTable>
  );
}
