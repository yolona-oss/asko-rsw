'use client';

import Link from 'next/link';
import { Badge, DataTableRow, DataTableCell } from '@asko/ui';
import { STATUS_LABELS, STATUS_BADGE_VARIANT, formatDate } from './constants';
import type { RepairRequest } from './types';

export function RequestTableRow({ request }: { request: RepairRequest }) {
  const deviceName = request.userDevice?.device?.name ?? 'Устройство';
  const statusLabel = STATUS_LABELS[request.status] ?? request.status;
  const badgeVariant = STATUS_BADGE_VARIANT[request.status] ?? 'neutral';

  return (
    <Link href={`/account/requests/${request.id}`} className="contents">
      <DataTableRow className="hover:bg-gray-50 transition-colors cursor-pointer">
        <DataTableCell mobileLabel="Устройство:" className="lg:w-[200px] lg:flex-shrink-0">
          <p className="text-sm font-medium text-text-main">{deviceName}</p>
        </DataTableCell>
        <DataTableCell mobileLabel="Описание:" className="lg:flex-1 lg:px-4">
          <p className="text-sm text-text-main truncate">{request.description}</p>
        </DataTableCell>
        <DataTableCell mobileLabel="Статус:" className="lg:w-[160px] lg:px-4">
          <Badge variant={badgeVariant} className="text-xs">{statusLabel}</Badge>
        </DataTableCell>
        <DataTableCell mobileLabel="Дата:" className="lg:w-[120px] lg:px-4">
          <p className="text-sm text-text-main">{formatDate(request.createdAt)}</p>
        </DataTableCell>
      </DataTableRow>
    </Link>
  );
}
