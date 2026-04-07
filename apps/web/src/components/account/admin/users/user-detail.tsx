'use client';

import { Badge, DetailRow, DetailSection } from '@asko/ui';

const fmt = (d: string) =>
  new Date(d).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });

export function UserDetail({ item }: { item: any; loading: boolean }) {
  const rolesList: string[] =
    item.roles && item.roles.length > 0
      ? item.roles.map((r: any) => (typeof r === 'string' ? r : r.name ?? r))
      : [];

  const oauthLinks: any[] = item.oauthLinks ?? item.oAuthLinks ?? [];

  return (
    <div className="flex flex-col">
      <DetailRow label="Имя" value={item.firstName ?? '-'} />
      <DetailRow label="Фамилия" value={item.lastName ?? '-'} />
      <DetailRow label="Email" value={item.email ?? '-'} />
      <DetailRow label="Телефон" value={item.phone ?? '-'} />
      <DetailRow
        label="Активен"
        value={
          <Badge variant={item.isActive ? 'success' : 'error'}>
            {item.isActive ? 'Да' : 'Нет'}
          </Badge>
        }
      />
      <DetailRow label="Дата регистрации" value={item.createdAt ? fmt(item.createdAt) : '-'} />

      <DetailSection label="Роли" summary={rolesList.length > 0 ? rolesList.join(', ') : '-'}>
        {rolesList.length > 0 ? rolesList.map((role, i) => (
          <DetailRow key={i} label={`#${i + 1}`} value={role} />
        )) : <DetailRow label="Роли" value="Нет ролей" />}
      </DetailSection>

      {oauthLinks.length > 0 && (
        <DetailSection label="OAuth провайдеры" summary={`${oauthLinks.length} шт.`}>
          {oauthLinks.map((link: any, i: number) => (
            <DetailRow key={link.id ?? i} label={link.provider ?? `-`} value={link.providerEmail ?? link.providerUserId ?? '-'} />
          ))}
        </DetailSection>
      )}
    </div>
  );
}
