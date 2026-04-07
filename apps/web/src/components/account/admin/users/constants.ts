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

export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleDateString('ru-RU', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

export function isExpired(expiresAt: string | Date): boolean {
  return new Date(expiresAt) < new Date();
}
