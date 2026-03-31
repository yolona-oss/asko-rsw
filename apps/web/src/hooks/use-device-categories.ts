'use client';

import { useQuery } from '@tanstack/react-query';
import { deviceCategoryApi } from '@/lib/api/device-category';
import type { DeviceCategoryRecord } from '@/lib/api/device-category';

export function useDeviceCategories() {
  return useQuery({
    queryKey: ['device-categories'],
    queryFn: () => deviceCategoryApi.getAll().then((r) => r.data.categories),
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
}

export function useCategoryLabel(categoryName: string | undefined, categories: DeviceCategoryRecord[] | undefined): string {
  if (!categoryName || !categories) return categoryName ?? '';
  return categories.find((c) => c.name === categoryName)?.label ?? categoryName;
}

export function buildCategoryLabelMap(categories: DeviceCategoryRecord[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const c of categories) {
    map[c.name] = c.label;
  }
  return map;
}
