import { Role } from '@asko/shared/client';
import type { IAuthUser } from '@/lib/api/types';

export type UserRole = 'user' | 'dealer' | 'manager' | 'admin' | 'repairer';

export interface AccountUser extends IAuthUser {
  avatar?: string;
}

export interface MenuItem {
  href: string;    // route path OR '#anchor-id' for in-page navigation
  label: string;
  icon: string;    // icon key
  children?: MenuItem[];
}

const ROLE_MAP: Partial<Record<Role, UserRole>> = {
  [Role.SUPER_ADMIN]: 'admin',
  [Role.ADMIN]: 'admin',
  [Role.USER]: 'user',
  [Role.DEALER]: 'dealer',
  [Role.MANAGER]: 'manager',
  [Role.REPAIRER]: 'repairer',
};

export function primaryRole(user: AccountUser): UserRole {
  for (const role of user.roles ?? []) {
    const mapped = ROLE_MAP[role as Role];
    if (mapped) return mapped;
  }
  return 'user';
}

export function displayName(user: AccountUser): string {
  const full = [user.lastName, user.firstName, user.middleName].filter(Boolean).join(' ');
  return full || user.email?.split('@')[0] || '';
}

export const menuByRole: Record<UserRole, MenuItem[]> = {
  admin: [
    { href: '/account', label: 'Главная', icon: 'home' },
    { href: '/account/devices', label: 'Устройства', icon: 'devices' },
    { href: '/account/parts', label: 'Запчасти', icon: 'wrench' },
    { href: '/account/articles', label: 'Статьи', icon: 'manual' },
    { href: '/account/users', label: 'Пользователи', icon: 'clients' },
    { href: '/account/manage-certificates', label: 'Сертификаты', icon: 'certificate' },
    { href: '/account/schedule', label: 'Расписание', icon: 'schedule' },
    { href: '/account/chat', label: 'Чат', icon: 'chat' },
    { href: '/account/profile', label: 'Профиль', icon: 'profile' },
  ],
  user: [
    { href: '/account', label: 'Главная', icon: 'home' },
    { href: '/account/requests', label: 'Заявки', icon: 'orders' },
    { href: '/account/certificates', label: 'Сертификат', icon: 'certificate' },
    { href: '/account/payments', label: 'Платежи', icon: 'payments' },
    { href: '/account/chat', label: 'Чат', icon: 'chat' },
    { href: '/account/profile', label: 'Профиль', icon: 'profile' },
  ],
  dealer: [
    { href: '/account', label: 'Главная', icon: 'home' },
    { href: '/account/certificates', label: 'Сертификаты', icon: 'certificate' },
    { href: '/account/payments', label: 'Платежи', icon: 'payments' },
    { href: '/account/chat', label: 'Чат', icon: 'chat' },
    { href: '/account/profile', label: 'Профиль', icon: 'profile' },
  ],
  manager: [
    { href: '/account', label: 'Главная', icon: 'home' },
    { href: '/account/requests', label: 'Заявки', icon: 'orders' },
    { href: '/account/users', label: 'Доступы', icon: 'clients' },
    { href: '/account/payments', label: 'Платежи', icon: 'payments' },
    { href: '/account/schedule', label: 'Расписание', icon: 'schedule' },
    { href: '/account/chat', label: 'Чат', icon: 'chat' },
    { href: '/account/profile', label: 'Профиль', icon: 'profile' },
  ],
  repairer: [
    { href: '/account', label: 'Главная', icon: 'home' },
    { href: '/account/requests', label: 'Заявка', icon: 'wrench' },
    { href: '/account/history', label: 'История', icon: 'history' },
    { href: '/account/man', label: 'Мануалы', icon: 'manual' },
    { href: '/account/parts', label: 'Запчасти', icon: 'wrench' },
    { href: '/account/schedule', label: 'Расписание', icon: 'schedule' },
    { href: '/account/chat', label: 'Чат', icon: 'chat' },
    { href: '/account/profile', label: 'Профиль', icon: 'profile' },
  ],
};

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 6) return 'Доброй ночи';
  if (hour < 12) return 'Доброе утро';
  if (hour < 18) return 'Добрый день';
  return 'Добрый вечер';
}
