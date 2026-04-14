'use client';

import { useState } from 'react';
import { Badge, DetailRow, DetailSection } from '@asko/ui';
import { api } from '@/lib/api/client';

const fmt = (d: string) =>
  new Date(d).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });

export function InvitationDetail({ item }: { item: any; loading: boolean }) {
  const [creator, setCreator] = useState<any>(null);

  const token = item.link ?? item.token ?? '-';
  const displayToken =
    typeof token === 'string' && token.length > 40 ? token.slice(0, 40) + '...' : token;

  const creatorId = item.creator?.id ?? item.creatorId;
  const creatorName = item.creator
    ? [item.creator.lastName, item.creator.firstName].filter(Boolean).join(' ') || item.creator.email || '-'
    : null;

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

      {(item.creator || creatorId) && (
        <DetailSection label="Создатель" summary={creatorName ?? '-'}
          fetchData={creatorId && !item.creator ? async () => { try { const { data } = await api.post('/users/batch', { ids: [creatorId] }, { _silent: true } as any); if (data.users?.[0]) setCreator(data.users[0]); } catch {} } : undefined}>
          {(creator || item.creator) ? (<>
            <DetailRow label="Имя" value={[creator?.lastName ?? item.creator?.lastName, creator?.firstName ?? item.creator?.firstName].filter(Boolean).join(' ') || '-'} />
            {(creator?.email ?? item.creator?.email) && <DetailRow label="Email" value={creator?.email ?? item.creator?.email} />}
            {(creator?.phone ?? item.creator?.phone) && <DetailRow label="Телефон" value={creator?.phone ?? item.creator?.phone} />}
          </>) : <DetailRow label="ID" value={creatorId} />}
        </DetailSection>
      )}
    </div>
  );
}
