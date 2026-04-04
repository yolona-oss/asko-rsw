import type { BadgeVariant, FilterDefinition } from '@asko/ui';

export const TYPE_LABELS: Record<string, string> = {
  work: 'Рабочий день',
  vacation: 'Отпуск',
  sick_leave: 'Больничный',
  overtime: 'Переработка',
  extra_day: 'Дополнительный день',
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
  work: 'info',
  vacation: 'warning',
  sick_leave: 'error',
  overtime: 'neutral',
  extra_day: 'success',
};

export const DAY_LABELS = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];

export function formatDate(d: string) {
  return new Date(d).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export const TYPE_FILTER: FilterDefinition = {
  key: 'type',
  label: 'Тип',
  type: 'tabs',
  options: [
    { value: '', label: 'Все' },
    { value: 'work', label: 'Рабочие' },
    { value: 'vacation', label: 'Отпуск' },
    { value: 'sick_leave', label: 'Больничные' },
    { value: 'overtime', label: 'Переработки' },
    { value: 'extra_day', label: 'Доп. дни' },
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
