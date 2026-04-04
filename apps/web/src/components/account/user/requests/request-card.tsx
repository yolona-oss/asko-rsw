'use client';

import Link from 'next/link';
import { Card, Badge } from '@asko/ui';
import { ArrowRight } from 'lucide-react';
import { STATUS_LABELS, STATUS_BADGE_VARIANT, formatDate } from './constants';
import type { RepairRequest } from './types';

export function RequestCard({ request }: { request: RepairRequest }) {
  const deviceName = request.userDevice?.device?.name ?? 'Устройство';
  const statusLabel = STATUS_LABELS[request.status] ?? request.status;
  const badgeVariant = STATUS_BADGE_VARIANT[request.status] ?? 'neutral';

  return (
    <Card padding="none" className="p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-text-sub">{formatDate(request.createdAt)}</span>
        <Badge variant={badgeVariant} className="text-xs">{statusLabel}</Badge>
      </div>
      <p className="text-base font-medium text-text-main truncate">{deviceName}</p>
      <p className="text-sm text-text-sub line-clamp-2">{request.description}</p>
      <Link
        href={`/account/requests/${request.id}`}
        className="flex items-center gap-1 text-sm text-text-main hover:text-brand-red transition-colors mt-auto pt-2"
      >
        Открыть заявку
        <ArrowRight className="w-4 h-4" />
      </Link>
    </Card>
  );
}
