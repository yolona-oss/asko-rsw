import type { FilterDefinition } from '@asko/ui';
import type { RepairerRecord } from '@/lib/api/types';

export type AccessTab = 'inactive' | 'active';

export const TAB_FILTER: FilterDefinition = {
  key: 'status',
  label: 'Статус',
  type: 'tabs',
  options: [
    { value: 'inactive', label: 'Новые' },
    { value: 'active', label: 'Активные' },
  ],
};

export const LIMIT = 20;

export function repairerName(r: RepairerRecord): string {
  const full = [r.user?.firstName, r.user?.lastName].filter(Boolean).join(' ');
  return full || r.user?.email?.split('@')[0] || r.userId;
}
