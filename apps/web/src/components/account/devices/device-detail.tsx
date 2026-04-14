'use client';

import { useState } from 'react';
import { Badge, DetailRow, DetailSection } from '@asko/ui';
import { api } from '@/lib/api/client';

const fmt = (d: string) =>
  new Date(d).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });

export async function fetchDeviceOne(item: any): Promise<any> {
  const { data } = await api.get(`/devices/${(item as any).id}`, { _silent: true } as any);
  return data;
}

export function DeviceDetail({ item, loading }: { item: any; loading: boolean }) {
  const [category, setCategory] = useState<any>(null);

  const desc = item.description
    ? item.description.length > 120
      ? item.description.slice(0, 120) + '...'
      : item.description
    : '-';

  const imageCount = item.images?.length ?? 0;

  return (
    <div className="flex flex-col">
      <DetailRow label="Название" value={item.name ?? '-'} />
      <DetailRow label="Бренд" value={item.brand ?? '-'} />
      <DetailRow label="Модель" value={item.model ?? '-'} />
      <DetailRow label="Описание" value={loading ? 'Загрузка...' : desc} />
      <DetailRow
        label="Избранное"
        value={
          <Badge variant={item.isFeatured ? 'success' : 'neutral'}>
            {item.isFeatured ? 'Да' : 'Нет'}
          </Badge>
        }
      />
      <DetailRow label="Дата создания" value={item.createdAt ? fmt(item.createdAt) : '-'} />

      <DetailSection label="Категория" summary={item.type ?? item.category?.label ?? '-'}
        fetchData={item.type ? async () => { try { const { data } = await api.get(`/device-categories/${item.type}`, { _silent: true } as any); setCategory(data); } catch {} } : undefined}>
        {category ? (<>
          <DetailRow label="Slug" value={category.name ?? category.slug ?? '-'} />
          <DetailRow label="Название" value={category.label ?? '-'} />
          {category.labelPlural && <DetailRow label="Название (мн. ч.)" value={category.labelPlural} />}
        </>) : <DetailRow label="Тип" value={item.type ?? item.category?.label ?? '-'} />}
      </DetailSection>

      {imageCount > 0 && (
        <DetailSection label="Изображения" summary={`${imageCount} шт.`}>
          {item.images.map((img: any, i: number) => (
            <DetailRow key={img.id ?? i} label={`#${i + 1}`} value={img.name ?? img.id ?? '-'} />
          ))}
        </DetailSection>
      )}
    </div>
  );
}
