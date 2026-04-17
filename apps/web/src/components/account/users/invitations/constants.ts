import type { FilterDefinition } from '@asko/ui';

// Admin role is intentionally excluded - admin accounts require direct provisioning
export const ROLE_OPTIONS = [
  { value: 'user', label: 'Пользователь' },
  { value: 'dealer', label: 'Дилер' },
  { value: 'manager', label: 'Менеджер' },
  { value: 'repairer', label: 'Мастер' },
];

export const TTL_OPTIONS: { value: number; label: string }[] = [
  { value: 3600, label: '1 час' },
  { value: 86400, label: '24 часа' },
  { value: 604800, label: '7 дней' },
  { value: 2592000, label: '30 дней' },
];

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


export function isExpired(expiresAt: string | Date): boolean {
  return new Date(expiresAt) < new Date();
}
