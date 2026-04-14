'use client';

import { Badge, DetailRow, DetailSection } from '@asko/ui';
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

      {item.user && (
        <DetailSection label="Пользователь" summary={loading ? '...' : (name ?? '-')}>
          <DetailRow label="Имя" value={name ?? '-'} />
          {item.user.email && <DetailRow label="Email" value={item.user.email} />}
          {item.user.phone && <DetailRow label="Телефон" value={item.user.phone} />}
        </DetailSection>
      )}

      {(item.activeRequestCount ?? 0) > 0 && (
        <DetailSection label="Активные заявки" summary={`${item.activeRequestCount} шт.`}>
          <DetailRow label="Количество" value={item.activeRequestCount} />
        </DetailSection>
      )}
    </div>
  );
}
