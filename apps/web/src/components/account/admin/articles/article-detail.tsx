'use client';

import { DetailRow, DetailSection } from '@asko/ui';
import { api } from '@/lib/api/client';

const fmt = (d: string) =>
  new Date(d).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });

export async function fetchArticleOne(item: any): Promise<any> {
  const { data } = await api.get(`/articles/${(item as any).id}`, { _silent: true } as any);
  return data;
}

export function ArticleDetail({ item, loading }: { item: any; loading: boolean }) {
  const authorName = item.author
    ? [item.author.lastName, item.author.firstName].filter(Boolean).join(' ') || item.author.email || '-'
    : null;

  const tagsList: string[] =
    item.tags && item.tags.length > 0
      ? item.tags.map((t: any) => (typeof t === 'string' ? t : t.name ?? t.tag))
      : [];

  return (
    <div className="flex flex-col">
      <DetailRow label="Заголовок" value={item.title ?? '-'} />
      <DetailRow label="Slug" value={item.slug ?? '-'} />
      <DetailRow label="Просмотры" value={item.viewCount ?? 0} />
      <DetailRow label="Дата создания" value={item.createdAt ? fmt(item.createdAt) : '-'} />
      <DetailRow label="Дата обновления" value={item.updatedAt ? fmt(item.updatedAt) : '-'} />

      {item.author && (
        <DetailSection label="Автор" summary={loading ? '...' : (authorName ?? '-')}>
          <DetailRow label="Имя" value={authorName ?? '-'} />
          {item.author.email && <DetailRow label="Email" value={item.author.email} />}
          {item.author.phone && <DetailRow label="Телефон" value={item.author.phone} />}
        </DetailSection>
      )}

      {tagsList.length > 0 && (
        <DetailSection label="Теги" summary={loading ? '...' : `${tagsList.length} шт.`}>
          {tagsList.map((tag, i) => (
            <DetailRow key={i} label={`#${i + 1}`} value={tag} />
          ))}
        </DetailSection>
      )}
    </div>
  );
}
