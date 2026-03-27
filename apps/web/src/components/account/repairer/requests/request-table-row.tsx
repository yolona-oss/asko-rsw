'use client';

import Link from 'next/link';
import {
  Badge,
  DataTableRow,
  DataTableCell,
} from '@asko/ui';
import { STATUS_BADGE_VARIANT, STATUS_LABELS, formatDate } from './constants';
import type { RepairRequest } from './types';

export function RequestTableRow({ request, highlight }: { request: RepairRequest; highlight?: boolean }) {
  const userName = [request.user?.lastName, request.user?.firstName].filter(Boolean).join(' ') || 'Клиент';
  const deviceName = request.userDevice?.device?.name || request.description;

  return (
    <DataTableRow className={highlight ? 'bg-brand-red/5' : undefined}>
      <DataTableCell mobileLabel="Клиент:" className="lg:w-[180px] lg:flex-shrink-0">
        <p className="text-sm font-medium text-text-main">{userName}</p>
      </DataTableCell>
      <DataTableCell mobileLabel="Устройство:" className="lg:flex-1 lg:px-4">
        <p className="text-sm text-text-main truncate">{deviceName}</p>
      </DataTableCell>
      <DataTableCell mobileLabel="Город:" className="lg:w-[120px] lg:px-4">
        <p className="text-sm text-text-main">{request.address?.city ?? '-'}</p>
      </DataTableCell>
      <DataTableCell mobileLabel="Статус:" className="lg:w-[160px] lg:px-4">
        <Badge variant={STATUS_BADGE_VARIANT[request.status] ?? 'neutral'} className="text-xs">
          {STATUS_LABELS[request.status] ?? request.status}
        </Badge>
      </DataTableCell>
      <DataTableCell mobileLabel="Стоимость:" className="lg:w-[100px] lg:px-4">
        <p className="text-sm text-text-main">
          {request.totalCost != null && request.totalCost > 0 ? `${request.totalCost.toLocaleString('ru-RU')} ₽` : '-'}
        </p>
      </DataTableCell>
      <DataTableCell mobileLabel="Дата:" className="lg:w-[140px] lg:px-4">
        <p className="text-sm text-text-main">{formatDate(request.createdAt)}</p>
      </DataTableCell>
      <DataTableCell className="lg:w-[120px] lg:flex-shrink-0 lg:text-right">
        <Link
          href={`/account/requests/${request.id}`}
          className="text-sm text-text-main hover:text-brand-red transition-colors flex items-center gap-1"
        >
          Открыть
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </Link>
      </DataTableCell>
    </DataTableRow>
  );
}
