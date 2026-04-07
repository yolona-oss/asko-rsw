'use client';

import { DetailRow } from '@asko/ui';
import { api } from '@/lib/api/client';

export async function fetchCategoryOne(item: any): Promise<any> {
  const { data } = await api.get(`/device-categories/${(item as any).id}`, {
    _silent: true,
  } as any);
  return data;
}

export function CategoryDetail({ item, loading }: { item: any; loading: boolean }) {
  return (
    <div className="flex flex-col">
      <DetailRow label="Slug" value={item.name ?? item.slug ?? '-'} />
      <DetailRow label="Название" value={loading ? 'Загрузка...' : (item.label ?? '-')} />
      <DetailRow
        label="Название (мн. ч.)"
        value={loading ? 'Загрузка...' : (item.labelPlural ?? '-')}
      />
      <DetailRow label="Порядок" value={item.order ?? 0} />
    </div>
  );
}
