'use client';

import { Card, Badge } from '@asko/ui';
import { useClickHandlers } from '@/hooks/use-click-handlers';
import { PaymentStatusBadge } from '@/components/account/payments/shared/payment-status-badge';
import { formatDate } from '@asko/shared/client';
import { STATUS_LABELS, STATUS_BADGE_VARIANT } from './list-constants';
import type { RepairRequest } from './list-types';

export function RequestCard({ request, payments, onClick, onDoubleClick }: {
  request: RepairRequest;
  payments?: any[];
  onClick?: () => void;
  onDoubleClick?: () => void;
}) {
  const { handleClick, handleDoubleClick } = useClickHandlers(onClick, onDoubleClick);
  const deviceName = request.userDevice?.device?.name ?? 'Устройство';
  const statusLabel = STATUS_LABELS[request.status] ?? request.status;
  const badgeVariant = STATUS_BADGE_VARIANT[request.status] ?? 'neutral';

  return (
    <Card padding="none" className={`p-5 flex flex-col gap-3${onClick || onDoubleClick ? ' cursor-pointer' : ''}`} onClick={handleClick} onDoubleClick={handleDoubleClick}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-text-sub">{formatDate(request.createdAt)}</span>
        <div className="flex items-center gap-1.5">
          <PaymentStatusBadge payments={payments} className="text-xs" />
          <Badge variant={badgeVariant} className="text-xs">{statusLabel}</Badge>
        </div>
      </div>
      <p className="text-base font-medium text-text-main truncate">{deviceName}</p>
      <p className="text-sm text-text-sub line-clamp-2">{request.description}</p>
    </Card>
  );
}
