'use client';

import { Badge, DetailRow } from '@asko/ui';
import { api } from '@/lib/api/client';

const fmt = (d: string) =>
  new Date(d).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });

export async function fetchDeviceOne(item: any): Promise<any> {
  const { data } = await api.get(`/devices/${(item as any).id}`, { _silent: true } as any);
  return data;
}

export function DeviceDetail({ item, loading }: { item: any; loading: boolean }) {
  const desc = item.description
    ? item.description.length > 120
      ? item.description.slice(0, 120) + '...'
      : item.description
    : '-';

  return (
    <div className="flex flex-col">
      <DetailRow label="Название" value={item.name ?? '-'} />
      <DetailRow label="Бренд" value={item.brand ?? '-'} />
      <DetailRow label="Модель" value={item.model ?? '-'} />
      <DetailRow label="Тип" value={item.type ?? item.category?.label ?? '-'} />
      <DetailRow label="Описание" value={loading ? 'Загрузка...' : desc} />
      <DetailRow
        label="Избранное"
        value={
          <Badge variant={item.isFeatured ? 'success' : 'neutral'}>
            {item.isFeatured ? 'Да' : 'Нет'}
          </Badge>
        }
      />
      <DetailRow label="Дата создания" value={item.createdAt ? fmt(item.createdAt) : '-'} />
    </div>
  );
}
