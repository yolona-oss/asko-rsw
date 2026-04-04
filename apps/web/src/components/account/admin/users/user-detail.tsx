'use client';

import { Badge } from '@asko/ui';
import { DetailRow } from '@/components/account/shared/detail-row';

const fmt = (d: string) =>
  new Date(d).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });

export function UserDetail({ item }: { item: any; loading: boolean }) {
  const roles =
    item.roles && item.roles.length > 0
      ? item.roles.map((r: any) => (typeof r === 'string' ? r : r.name ?? r)).join(', ')
      : '-';

  return (
    <div className="flex flex-col">
      <DetailRow label="Имя" value={item.firstName ?? '-'} />
      <DetailRow label="Фамилия" value={item.lastName ?? '-'} />
      <DetailRow label="Email" value={item.email ?? '-'} />
      <DetailRow label="Телефон" value={item.phone ?? '-'} />
      <DetailRow label="Роли" value={roles} />
      <DetailRow
        label="Активен"
        value={
          <Badge variant={item.isActive ? 'success' : 'error'}>
            {item.isActive ? 'Да' : 'Нет'}
          </Badge>
        }
      />
      <DetailRow label="Дата регистрации" value={item.createdAt ? fmt(item.createdAt) : '-'} />
    </div>
  );
}
