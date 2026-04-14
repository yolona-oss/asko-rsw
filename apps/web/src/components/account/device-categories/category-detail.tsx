'use client';

import { useState } from 'react';
import { DetailRow, DetailSection } from '@asko/ui';
import { api } from '@/lib/api/client';

export async function fetchCategoryOne(item: any): Promise<any> {
  const { data } = await api.get(`/device-categories/${(item as any).id}`, {
    _silent: true,
  } as any);
  return data;
}

export function CategoryDetail({ item, loading }: { item: any; loading: boolean }) {
  const [parent, setParent] = useState<any>(null);

  const parentId = item.parentId ?? item.parent?.id;

  return (
    <div className="flex flex-col">
      <DetailRow label="Slug" value={item.name ?? item.slug ?? '-'} />
      <DetailRow label="Название" value={loading ? 'Загрузка...' : (item.label ?? '-')} />
      <DetailRow
        label="Название (мн. ч.)"
        value={loading ? 'Загрузка...' : (item.labelPlural ?? '-')}
      />
      <DetailRow label="Порядок" value={item.order ?? 0} />

      {parentId && (
        <DetailSection label="Родительская категория" summary={item.parent?.label ?? parentId}
          fetchData={async () => { try { const { data } = await api.get(`/device-categories/${parentId}`, { _silent: true } as any); setParent(data); } catch {} }}>
          {parent ? (<>
            <DetailRow label="Slug" value={parent.name ?? parent.slug ?? '-'} />
            <DetailRow label="Название" value={parent.label ?? '-'} />
            {parent.labelPlural && <DetailRow label="Название (мн. ч.)" value={parent.labelPlural} />}
          </>) : <DetailRow label="ID" value={parentId} />}
        </DetailSection>
      )}
    </div>
  );
}
