'use client';

import { Card, ContextMenuArea, buildCardMenuItems } from '@asko/ui';
import type { DropdownMenuEntry } from '@asko/ui';
import { Package, Wrench } from 'lucide-react';
import { useClickHandlers } from '@/hooks/use-click-handlers';
import type { DevicePartRecord } from '@/lib/api/types';

export function PartCard({ part, isAdmin, onEdit, onDelete, onClick }: {
  part: DevicePartRecord;
  isAdmin: boolean;
  onEdit?: (part: DevicePartRecord) => void;
  onDelete?: (id: string) => void;
  onClick?: () => void;
}) {
  const { handleClick } = useClickHandlers(onClick, isAdmin && onEdit ? () => onEdit(part) : undefined);

  const customItems: DropdownMenuEntry[] = isAdmin ? [
    { key: 'edit', label: 'Редактировать', onClick: () => onEdit?.(part) },
    { key: 'delete', label: 'Удалить', variant: 'danger', onClick: () => onDelete?.(part.id) },
  ] : [];

  const menuItems = buildCardMenuItems(onClick, isAdmin && onEdit ? () => onEdit(part) : undefined, customItems);

  const isGeneric = !part.deviceId;
  const Icon = isGeneric ? Package : Wrench;

  return (
    <ContextMenuArea items={menuItems}>
      <Card
        padding="none"
        className={`p-4 flex flex-col gap-3${onClick ? ' cursor-pointer' : ''}`}
        onClick={handleClick}
      >
        <div className="flex items-start gap-3">
          <div className="shrink-0 w-10 h-10 bg-surface-secondary flex items-center justify-center">
            <Icon className="w-5 h-5 text-icon" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium text-text-main truncate">{part.name}</p>
              {part.price != null && part.price > 0 && (
                <span className="shrink-0 text-xs font-medium text-text-main bg-surface-secondary px-2 py-0.5">
                  {part.price} &#8381;
                </span>
              )}
            </div>
            {part.partNumber && (
              <p className="text-xs text-text-sub mt-0.5">Артикул: {part.partNumber}</p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1 text-sm">
          <div className="flex justify-between">
            <span className="text-text-sub">Устройство</span>
            <span className="text-text-main">{part.deviceName || 'Общая'}</span>
          </div>
          {part.description && (
            <p className="text-xs text-text-sub line-clamp-2 mt-1">{part.description}</p>
          )}
        </div>
      </Card>
    </ContextMenuArea>
  );
}
