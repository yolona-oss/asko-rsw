'use client';

import { useRouter } from 'next/navigation';
import { Card, ContextMenuArea } from '@asko/ui';
import type { DropdownMenuEntry } from '@asko/ui';
import type { Device } from './types';

export function DeviceCard({ device, categoryLabels, onDelete }: {
  device: Device;
  categoryLabels: Record<string, string>;
  onDelete: (id: string) => void;
}) {
  const router = useRouter();

  const menuItems: DropdownMenuEntry[] = [
    { key: 'edit', label: 'Изменить', onClick: () => router.push(`/account/devices/${device.id}`) },
    { key: 'delete', label: 'Удалить', variant: 'danger', onClick: () => onDelete(device.id) },
  ];

  return (
    <ContextMenuArea items={menuItems}>
      <Card padding="none" className="p-5 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium text-text-main">{device.name}</p>
          {device.isFeatured && (
            <span className="shrink-0 px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700">
              Главная
            </span>
          )}
        </div>
        <div className="flex flex-col gap-1 text-sm">
          <div className="flex justify-between">
            <span className="text-text-sub">Тип</span>
            <span className="text-text-main">{categoryLabels[device.type ?? ''] ?? device.type}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-sub">Модель</span>
            <span className="text-text-main">{device.model}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-sub">Бренд</span>
            <span className="text-text-main">{device.brand}</span>
          </div>
        </div>
      </Card>
    </ContextMenuArea>
  );
}
