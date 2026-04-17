import type { BadgeVariant, FilterDefinition } from '@asko/ui';
import type { PatternSlot } from './types';

export const TYPE_LABELS: Record<string, string> = {
  vacation: 'Отпуск',
  sick_leave: 'Больничный',
  overtime: 'Переработка',
  schedule_override: 'Замена выходного',
};

export const STATUS_LABELS: Record<string, string> = {
  pending: 'На рассмотрении',
  approved: 'Одобрено',
  rejected: 'Отклонено',
};

export const STATUS_BADGE_VARIANT: Record<string, BadgeVariant> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'error',
};

export const TYPE_BADGE_VARIANT: Record<string, BadgeVariant> = {
  vacation: 'warning',
  sick_leave: 'error',
  overtime: 'neutral',
  schedule_override: 'success',
};

export function formatDate(d: string) {
  return new Date(d).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function formatRange(from?: string, to?: string) {
  if (!from && !to) return '-';
  if (from && to && from !== to) return `${formatDate(from)} — ${formatDate(to)}`;
  return formatDate(from || to || '');
}

export const TYPE_FILTER: FilterDefinition = {
  key: 'type',
  label: 'Тип',
  type: 'tabs',
  options: [
    { value: '', label: 'Все' },
    { value: 'vacation', label: 'Отпуск' },
    { value: 'sick_leave', label: 'Больничные' },
    { value: 'overtime', label: 'Переработки' },
    { value: 'schedule_override', label: 'Замены выходных' },
  ],
};

export const STATUS_FILTER: FilterDefinition = {
  key: 'status',
  label: 'Статус',
  type: 'tabs',
  options: [
    { value: '', label: 'Все' },
    { value: 'pending', label: 'На рассмотрении' },
    { value: 'approved', label: 'Одобренные' },
    { value: 'rejected', label: 'Отклонённые' },
  ],
};

export interface PresetDefinition {
  label: string;
  description?: string;
  slots: PatternSlot[];
}

function buildSlots(work: number, rest: number): PatternSlot[] {
  const out: PatternSlot[] = [];
  for (let i = 0; i < work; i++) out.push({ work: true });
  for (let i = 0; i < rest; i++) out.push({ work: false });
  return out;
}

export const PRESETS: PresetDefinition[] = [
  { label: '5/2', description: '5 рабочих, 2 выходных', slots: buildSlots(5, 2) },
  { label: '2/2', description: '2 рабочих, 2 выходных', slots: buildSlots(2, 2) },
  { label: '3/3', description: '3 рабочих, 3 выходных', slots: buildSlots(3, 3) },
  { label: '6/1', description: '6 рабочих, 1 выходной', slots: buildSlots(6, 1) },
  { label: '7/0', description: 'Каждый день рабочий', slots: buildSlots(7, 0) },
];
