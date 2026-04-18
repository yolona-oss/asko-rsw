import type { FilterDefinition } from '@asko/ui';

export { ROLE_OPTIONS, TTL_OPTIONS } from '../constants';

export const ROLE_LABELS: Record<string, string> = {
  user: 'Пользователь',
  dealer: 'Дилер',
  manager: 'Менеджер',
  repairer: 'Мастер',
  admin: 'Администратор',
  super_admin: 'Супер-администратор',
};

export const STATUS_FILTER: FilterDefinition = {
  key: 'status',
  label: 'Статус',
  type: 'tabs',
  options: [
    { value: 'all', label: 'Все' },
    { value: 'active', label: 'Активные' },
    { value: 'used', label: 'Использованные' },
    { value: 'expired', label: 'Истекшие' },
  ],
};


export { isExpired } from '@asko/shared/client';
