'use client';

import Link from 'next/link';
import { Card, Badge } from '@asko/ui';
import { STATUS_BADGE_VARIANT, STATUS_LABELS, formatDate } from './constants';
import type { RepairRequest } from './types';

export function RequestCard({ request, highlight }: { request: RepairRequest; highlight?: boolean }) {
  const userName = [request.user?.lastName, request.user?.firstName].filter(Boolean).join(' ') || 'Клиент';
  const deviceName = request.userDevice?.device?.name || request.description;

  return (
    <Card padding="none" className={`p-5 flex flex-col gap-3 ${highlight ? 'ring-2 ring-brand-red' : ''}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs text-text-sub">
          <span>{formatDate(request.createdAt)}</span>
          {request.address?.city && (
            <>
              <span>&bull;</span>
              <span>{request.address.city}</span>
            </>
          )}
        </div>
        <Badge variant={STATUS_BADGE_VARIANT[request.status] ?? 'neutral'} className="text-xs">
          {STATUS_LABELS[request.status] ?? request.status}
        </Badge>
      </div>
      <p className="text-sm font-medium text-text-main">{userName}</p>
      <p className="text-sm text-text-sub truncate">{deviceName}</p>
      {request.totalCost != null && request.totalCost > 0 && (
        <span className="text-xs text-text-sub">{request.totalCost.toLocaleString('ru-RU')} ₽</span>
      )}
      <Link
        href={`/account/requests/${request.id}`}
        className="flex items-center gap-1 text-sm text-text-main hover:text-brand-red transition-colors mt-auto pt-2"
      >
        Открыть заявку
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
        </svg>
      </Link>
    </Card>
  );
}
