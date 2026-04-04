'use client';

import { Badge } from '@asko/ui';
import { DetailRow } from '@/components/account/shared/detail-row';

const fmt = (d: string) =>
  new Date(d).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });

export function InvitationDetail({ item }: { item: any; loading: boolean }) {
  const token = item.link ?? item.token ?? '-';
  const displayToken =
    typeof token === 'string' && token.length > 40 ? token.slice(0, 40) + '...' : token;

  return (
    <div className="flex flex-col">
      <DetailRow label="Роль" value={item.role ?? '-'} />
      <DetailRow label="Ссылка / токен" value={displayToken} />
      <DetailRow label="Срок действия" value={item.expiresAt ? fmt(item.expiresAt) : '-'} />
      <DetailRow
        label="Использована"
        value={
          <Badge variant={item.used ? 'success' : 'warning'}>
            {item.used ? 'Да' : 'Нет'}
          </Badge>
        }
      />
      <DetailRow label="Дата создания" value={item.createdAt ? fmt(item.createdAt) : '-'} />
    </div>
  );
}
