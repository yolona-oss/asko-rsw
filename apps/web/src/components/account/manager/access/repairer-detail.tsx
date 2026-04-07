'use client';

import { Badge, DetailRow } from '@asko/ui';
import { api } from '@/lib/api/client';

export async function fetchRepairerOne(item: any): Promise<any> {
  const { data } = await api.get(`/repairers/${(item as any).id}`, { _silent: true } as any);
  return data;
}

export function RepairerDetail({ item, loading }: { item: any; loading: boolean }) {
  const name =
    [item.user?.lastName, item.user?.firstName].filter(Boolean).join(' ') || null;

  return (
    <div className="flex flex-col">
      <DetailRow label="Имя" value={loading ? 'Загрузка...' : (name ?? '-')} />
      <DetailRow label="Email" value={loading ? 'Загрузка...' : (item.user?.email ?? '-')} />
      <DetailRow label="Телефон" value={loading ? 'Загрузка...' : (item.user?.phone ?? '-')} />
      <DetailRow label="Город" value={item.city ?? '-'} />
      <DetailRow
        label="Активен"
        value={
          <Badge variant={item.isActive ? 'success' : 'error'}>
            {item.isActive ? 'Да' : 'Нет'}
          </Badge>
        }
      />
      <DetailRow
        label="Завершено ремонтов"
        value={item.completedRepairs ?? 0}
      />
    </div>
  );
}
