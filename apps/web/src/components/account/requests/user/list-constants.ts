import { RepairRequestStatus } from '@asko/shared/client';
import type { BadgeVariant, FilterDefinition } from '@asko/ui';

export const STATUS_LABELS: Record<string, string> = {
  [RepairRequestStatus.PENDING]: 'В обработке',
  [RepairRequestStatus.ASSIGNED]: 'Назначен мастер',
  [RepairRequestStatus.ACCEPTED]: 'Принята мастером',
  [RepairRequestStatus.EN_ROUTE]: 'Мастер выехал',
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
  [RepairRequestStatus.ASSIGNED]: 'info',
  [RepairRequestStatus.ACCEPTED]: 'info',
  [RepairRequestStatus.EN_ROUTE]: 'info',
  [RepairRequestStatus.IN_PROGRESS]: 'info',
  [RepairRequestStatus.AWAITING_COMPLETION]: 'info',
  [RepairRequestStatus.COMPLETED]: 'success',
  [RepairRequestStatus.CANCELLED]: 'neutral',
  [RepairRequestStatus.REFUSED]: 'error',
  [RepairRequestStatus.REFUND_REQUESTED]: 'warning',
  [RepairRequestStatus.REFUNDED]: 'neutral',
};

export type StatusFilter = '' | 'active' | 'completed' | 'cancelled';

export const STATUS_TAB_MAP: Record<string, StatusFilter> = {
  [RepairRequestStatus.PENDING]: 'active',
  [RepairRequestStatus.ASSIGNED]: 'active',
  [RepairRequestStatus.ACCEPTED]: 'active',
  [RepairRequestStatus.EN_ROUTE]: 'active',
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
    { value: '', label: 'Все' },
    { value: 'active', label: 'Активные' },
    { value: 'completed', label: 'Завершенные' },
    { value: 'cancelled', label: 'Отмененные' },
  ],
};
