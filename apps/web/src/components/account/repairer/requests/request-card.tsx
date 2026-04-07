'use client';

import { Card, Badge, ContextMenuArea, buildCardMenuItems } from '@asko/ui';
import { useClickHandlers } from '@/hooks/use-click-handlers';
import { STATUS_BADGE_VARIANT, STATUS_LABELS, formatDate } from './constants';
import type { RepairRequest } from './types';

export function RequestCard({ request, highlight, onClick, onDoubleClick }: {
  request: RepairRequest;
  highlight?: boolean;
  onClick?: () => void;
  onDoubleClick?: () => void;
}) {
  const { handleClick, handleDoubleClick } = useClickHandlers(onClick, onDoubleClick);
  const userName = [request.user?.lastName, request.user?.firstName].filter(Boolean).join(' ') || 'Клиент';
  const deviceName = request.userDevice?.device?.name || request.description;

  return (
    <ContextMenuArea
      items={buildCardMenuItems(onClick, onDoubleClick)}
    >
      <Card padding="none" className={`p-5 flex flex-col gap-3 ${highlight ? 'ring-2 ring-brand-red' : ''}${onClick || onDoubleClick ? ' cursor-pointer' : ''}`} onClick={handleClick} onDoubleClick={handleDoubleClick}>
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
      </Card>
    </ContextMenuArea>
  );
}
