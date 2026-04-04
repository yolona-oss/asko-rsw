'use client';

import { Badge } from '@asko/ui';
import type { BadgeVariant } from '@asko/ui';
import { DetailRow } from '@/components/account/shared/detail-row';
import { api } from '@/lib/api/client';

const fmt = (d: string) =>
  new Date(d).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });

const statusVariant = (s: string): BadgeVariant => {
  switch (s) {
    case 'completed':
      return 'success';
    case 'pending':
    case 'in_progress':
      return 'warning';
    case 'cancelled':
    case 'refused':
      return 'error';
    default:
      return 'neutral';
  }
};

export async function fetchRepairRequestOne(item: any): Promise<any> {
  const { data } = await api.get(`/repair-requests/${(item as any).id}`, {
    _silent: true,
  } as any);
  return (data as any)?.request ?? data;
}

export function RepairRequestDetail({ item, loading }: { item: any; loading: boolean }) {
  const userName = [item.user?.lastName, item.user?.firstName].filter(Boolean).join(' ') || null;
  const deviceName = item.userDevice?.device?.name ?? item.device?.name;
  const repairerName =
    [item.repairer?.user?.lastName, item.repairer?.user?.firstName].filter(Boolean).join(' ') ||
    null;
  const address = [item.address?.city, item.address?.street, item.address?.house]
    .filter(Boolean)
    .join(', ');

  return (
    <div className="flex flex-col">
      <DetailRow
        label="Статус"
        value={
          item.status ? (
            <Badge variant={statusVariant(item.status)}>{item.status}</Badge>
          ) : (
            '-'
          )
        }
      />
      <DetailRow label="Клиент" value={loading ? 'Загрузка...' : (userName ?? '-')} />
      <DetailRow label="Устройство" value={loading ? 'Загрузка...' : (deviceName ?? '-')} />
      <DetailRow
        label="Описание"
        value={
          loading
            ? 'Загрузка...'
            : item.description
              ? item.description.length > 120
                ? item.description.slice(0, 120) + '...'
                : item.description
              : '-'
        }
      />
      <DetailRow label="Адрес" value={loading ? 'Загрузка...' : (address || '-')} />
      <DetailRow label="Мастер" value={loading ? 'Загрузка...' : (repairerName ?? '-')} />
      <DetailRow
        label="Стоимость"
        value={item.totalCost != null ? `${item.totalCost} \u20BD` : '-'}
      />
      <DetailRow label="Дата создания" value={item.createdAt ? fmt(item.createdAt) : '-'} />
    </div>
  );
}
