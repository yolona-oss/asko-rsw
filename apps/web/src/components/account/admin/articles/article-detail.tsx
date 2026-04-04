'use client';

import { DetailRow } from '@/components/account/shared/detail-row';
import { api } from '@/lib/api/client';

const fmt = (d: string) =>
  new Date(d).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });

export async function fetchArticleOne(item: any): Promise<any> {
  const { data } = await api.get(`/articles/${(item as any).id}`, { _silent: true } as any);
  return data;
}

export function ArticleDetail({ item, loading }: { item: any; loading: boolean }) {
  const tags =
    item.tags && item.tags.length > 0
      ? item.tags.map((t: any) => (typeof t === 'string' ? t : t.name ?? t.tag)).join(', ')
      : '-';

  return (
    <div className="flex flex-col">
      <DetailRow label="Заголовок" value={item.title ?? '-'} />
      <DetailRow label="Slug" value={item.slug ?? '-'} />
      <DetailRow label="Теги" value={loading ? 'Загрузка...' : tags} />
      <DetailRow label="Просмотры" value={item.viewCount ?? 0} />
      <DetailRow label="Дата создания" value={item.createdAt ? fmt(item.createdAt) : '-'} />
      <DetailRow label="Дата обновления" value={item.updatedAt ? fmt(item.updatedAt) : '-'} />
    </div>
  );
}
