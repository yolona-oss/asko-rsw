'use client';

import Link from 'next/link';
import { Button, Card } from '@asko/ui';
import type { Device } from './types';
import { TYPE_LABELS } from './constants';

export function DeviceCard({ device, onDelete }: { device: Device; onDelete: (id: string) => void }) {
  return (
    <Card padding="none" className="p-5 flex flex-col gap-3">
      <p className="text-sm font-medium text-text-main">{device.name}</p>
      <div className="flex flex-col gap-1 text-sm">
        <div className="flex justify-between">
          <span className="text-text-sub">Тип</span>
          <span className="text-text-main">{TYPE_LABELS[device.type] ?? device.type}</span>
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
      <div className="flex gap-2 pt-1">
        <Link href={`/account/devices/${device.id}`}>
          <Button variant="secondary" size="sm">Изменить</Button>
        </Link>
        <Button variant="danger" size="sm" onClick={() => onDelete(device.id)}>Удалить</Button>
      </div>
    </Card>
  );
}
