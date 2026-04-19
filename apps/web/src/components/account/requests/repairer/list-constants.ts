import { RepairRequestStatus } from '@asko/shared/client';
import type { BadgeVariant, FilterDefinition } from '@asko/ui';

export type TabKey = 'active' | 'completed';

export const TAB_FILTER: FilterDefinition = {
  key: 'tab',
  label: 'Заявки',
  type: 'tabs',
  options: [
    { value: 'active', label: 'Активные' },
    { value: 'completed', label: 'Завершённые' },
  ],
};

export const STATUS_BADGE_VARIANT: Record<string, BadgeVariant> = {
  [RepairRequestStatus.ASSIGNED]: 'warning',
  [RepairRequestStatus.ACCEPTED]: 'warning',
  [RepairRequestStatus.EN_ROUTE]: 'info',
  [RepairRequestStatus.IN_PROGRESS]: 'info',
  [RepairRequestStatus.PAUSED]: 'warning',
  [RepairRequestStatus.AWAITING_COMPLETION]: 'info',
  [RepairRequestStatus.COMPLETED]: 'neutral',
  [RepairRequestStatus.CANCELLED]: 'error',
  [RepairRequestStatus.REFUSED]: 'error',
};

export const STATUS_LABELS: Record<string, string> = {
  [RepairRequestStatus.ASSIGNED]: 'Назначена',
  [RepairRequestStatus.ACCEPTED]: 'Принята',
  [RepairRequestStatus.EN_ROUTE]: 'В пути',
  [RepairRequestStatus.IN_PROGRESS]: 'В работе',
  [RepairRequestStatus.PAUSED]: 'Приостановлена',
  [RepairRequestStatus.AWAITING_COMPLETION]: 'Ожидает завершения',
  [RepairRequestStatus.COMPLETED]: 'Завершена',
  [RepairRequestStatus.CANCELLED]: 'Отменена',
  [RepairRequestStatus.REFUSED]: 'Отказ',
};

export const PAGE_SIZE = 12;
