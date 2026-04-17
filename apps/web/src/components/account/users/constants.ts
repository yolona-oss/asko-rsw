import type { FilterDefinition } from '@asko/ui';
import type { UserTab } from './types';

export const TABS: { key: UserTab; label: string }[] = [
  { key: 'repairer', label: 'Мастера' },
  { key: 'dealer', label: 'Дилеры' },
  { key: 'user', label: 'Клиенты' },
  { key: 'manager', label: 'Менеджеры' },
];

export const ROLE_LABELS: Record<string, string> = {
  user: 'Клиент',
  dealer: 'Дилер',
  manager: 'Менеджер',
  repairer: 'Мастер',
  admin: 'Администратор',
  super_admin: 'Суперадмин',
};

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

export const ROLE_TAB_FILTER_DEF: FilterDefinition = {
  key: 'role',
  label: 'Роли',
  type: 'tabs',
  options: TABS.map((t) => ({ value: t.key, label: t.label })),
};

export const INVITE_ROLE_LABELS: Record<string, string> = {
  user: 'Пользователь',
  dealer: 'Дилер',
  manager: 'Менеджер',
  repairer: 'Мастер',
  admin: 'Администратор',
};

export function isExpired(expiresAt: string | Date): boolean {
  return new Date(expiresAt) < new Date();
}
