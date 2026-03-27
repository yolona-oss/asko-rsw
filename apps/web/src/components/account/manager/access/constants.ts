import type { FilterDefinition } from '@asko/ui';
import type { IRepairer } from '@/lib/api/types';

export type AccessTab = 'inactive' | 'active';

export const TAB_FILTER: FilterDefinition = {
  key: 'status',
  label: '',
  type: 'tabs',
  options: [
    { value: 'inactive', label: 'Новые' },
    { value: 'active', label: 'Активные' },
  ],
};

export const LIMIT = 20;

export function repairerName(r: IRepairer): string {
  const full = [r.user?.firstName, r.user?.lastName].filter(Boolean).join(' ');
  return full || r.user?.email?.split('@')[0] || r.userId;
}

export function formatDate(date: string | Date | undefined): string {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}
