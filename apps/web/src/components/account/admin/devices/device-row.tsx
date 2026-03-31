'use client';

import Link from 'next/link';
import {
  Button,
  DataTableRow,
  DataTableCell,
} from '@asko/ui';
import type { Device } from './types';
import { TYPE_LABELS } from './constants';

export function DeviceRow({ device, onDelete }: { device: Device; onDelete: (id: string) => void }) {
  return (
    <DataTableRow>
      <DataTableCell mobileLabel="Название:" className="lg:w-35 lg:flex-shrink-0">
        <p className="text-sm font-medium text-text-main">{device.name}</p>
      </DataTableCell>
      <DataTableCell mobileLabel="Тип:" className="lg:flex-1 lg:px-4">
        <p className="text-sm text-text-main">{TYPE_LABELS[device.type] ?? device.type}</p>
      </DataTableCell>
      <DataTableCell mobileLabel="Модель:" className="lg:flex-1 lg:px-4">
        <p className="text-sm text-text-main">{device.model}</p>
      </DataTableCell>
      <DataTableCell mobileLabel="Бренд:" className="lg:w-20 lg:px-4">
        <p className="text-sm text-text-main">{device.brand}</p>
      </DataTableCell>
      <DataTableCell mobileLabel="Главная:" className="lg:w-24 lg:px-4 lg:text-center">
        {device.isFeatured ? (
          <span className="inline-block px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-sm">Да</span>
        ) : (
          <span className="inline-block px-2 py-0.5 text-xs text-text-sub">Нет</span>
        )}
      </DataTableCell>
      <DataTableCell className="lg:w-[200px] lg:flex-shrink-0 lg:text-right flex gap-2">
        <Link href={`/account/devices/${device.id}`}>
          <Button variant="secondary" size="sm">
            Изменить
          </Button>
        </Link>
        <Button variant="danger" size="sm" onClick={() => onDelete(device.id)}>
          Удалить
        </Button>
      </DataTableCell>
    </DataTableRow>
  );
}
