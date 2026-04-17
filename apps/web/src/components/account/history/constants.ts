import { RepairRequestStatus } from '@asko/shared/client';
import type { BadgeVariant, FilterDefinition } from '@asko/ui';

export type GroupKey = 'all' | 'per-request' | 'per-user-device';

export const GROUP_FILTER: FilterDefinition = {
  key: 'group',
  label: 'Группировка',
  type: 'tabs',
  options: [
    { value: 'all', label: 'Все' },
    { value: 'per-request', label: 'По заявкам' },
    { value: 'per-user-device', label: 'По устройствам' },
  ],
};

export const STATUS_LABEL: Partial<Record<RepairRequestStatus, string>> = {
  [RepairRequestStatus.COMPLETED]: 'Выполнено',
  [RepairRequestStatus.REFUSED]: 'Отклонено',
  [RepairRequestStatus.CANCELLED]: 'Отменено',
  [RepairRequestStatus.IN_PROGRESS]: 'В работе',
  [RepairRequestStatus.ASSIGNED]: 'Назначена',
  [RepairRequestStatus.ACCEPTED]: 'Принята',
};

export const STATUS_BADGE: Partial<Record<RepairRequestStatus, BadgeVariant>> = {
  [RepairRequestStatus.COMPLETED]: 'success',
  [RepairRequestStatus.REFUSED]: 'error',
  [RepairRequestStatus.CANCELLED]: 'neutral',
  [RepairRequestStatus.IN_PROGRESS]: 'warning',
  [RepairRequestStatus.ASSIGNED]: 'info',
  [RepairRequestStatus.ACCEPTED]: 'info',
};

export const LIMIT = 10;
