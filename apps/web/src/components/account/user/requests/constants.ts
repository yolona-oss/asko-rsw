import { RepairRequestStatus } from '@asko/shared/client';
import type { BadgeVariant, FilterDefinition } from '@asko/ui';

export const STATUS_LABELS: Record<string, string> = {
  [RepairRequestStatus.PENDING]: 'В обработке',
  [RepairRequestStatus.PAID]: 'Оплачена',
  [RepairRequestStatus.ASSIGNED]: 'Назначен мастер',
  [RepairRequestStatus.ACCEPTED]: 'Мастер выехал',
  [RepairRequestStatus.IN_PROGRESS]: 'В работе',
  [RepairRequestStatus.AWAITING_COMPLETION]: 'Завершается',
  [RepairRequestStatus.COMPLETED]: 'Завершена',
  [RepairRequestStatus.CANCELLED]: 'Отменена',
  [RepairRequestStatus.REFUSED]: 'Отказ мастера',
  [RepairRequestStatus.REFUND_REQUESTED]: 'Запрос возврата',
  [RepairRequestStatus.REFUNDED]: 'Возврат',
};

export const STATUS_BADGE_VARIANT: Record<string, BadgeVariant> = {
  [RepairRequestStatus.PENDING]: 'warning',
  [RepairRequestStatus.PAID]: 'warning',
  [RepairRequestStatus.ASSIGNED]: 'info',
  [RepairRequestStatus.ACCEPTED]: 'info',
  [RepairRequestStatus.IN_PROGRESS]: 'info',
  [RepairRequestStatus.AWAITING_COMPLETION]: 'info',
  [RepairRequestStatus.COMPLETED]: 'success',
  [RepairRequestStatus.CANCELLED]: 'neutral',
  [RepairRequestStatus.REFUSED]: 'error',
  [RepairRequestStatus.REFUND_REQUESTED]: 'warning',
  [RepairRequestStatus.REFUNDED]: 'neutral',
};

export type StatusFilter = 'all' | 'active' | 'completed' | 'cancelled';

export const STATUS_TAB_MAP: Record<string, StatusFilter> = {
  [RepairRequestStatus.PENDING]: 'active',
  [RepairRequestStatus.PAID]: 'active',
  [RepairRequestStatus.ASSIGNED]: 'active',
  [RepairRequestStatus.ACCEPTED]: 'active',
  [RepairRequestStatus.IN_PROGRESS]: 'active',
  [RepairRequestStatus.AWAITING_COMPLETION]: 'active',
  [RepairRequestStatus.COMPLETED]: 'completed',
  [RepairRequestStatus.CANCELLED]: 'cancelled',
  [RepairRequestStatus.REFUSED]: 'cancelled',
  [RepairRequestStatus.REFUND_REQUESTED]: 'cancelled',
  [RepairRequestStatus.REFUNDED]: 'cancelled',
};

export const STATUS_FILTER: FilterDefinition = {
  key: 'status',
  label: 'Статус',
  type: 'tabs',
  options: [
    { value: 'all', label: 'Все' },
    { value: 'active', label: 'Активные' },
    { value: 'completed', label: 'Завершенные' },
    { value: 'cancelled', label: 'Отмененные' },
  ],
};

export function formatDate(dateStr: Date | string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
