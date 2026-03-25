import { Role } from '@asko/shared/client';
import type { IAuthUser } from '@/lib/api/types';

export type UserRole = 'user' | 'dealer' | 'manager' | 'admin' | 'repairer';
export type LoadingStage = 'skeleton' | 'partial' | 'loaded';

export interface AccountUser extends IAuthUser {
  avatar?: string;
}

export interface MenuItem {
  href: string;
  label: string;
  icon: string; // icon key
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
  for (const role of user.roles) {
    const mapped = ROLE_MAP[role as Role];
    if (mapped) return mapped;
  }
  return 'user';
}

export function displayName(user: AccountUser): string {
  const full = [user.firstName, user.lastName].filter(Boolean).join(' ');
  return full || user.email?.split('@')[0] || '';
}

export const menuByRole: Record<UserRole, MenuItem[]> = {
  admin: [
    { href: '/account', label: 'Главная', icon: 'home' },
    { href: '/account/devices', label: 'Устройства', icon: 'devices' },
    { href: '/account/articles', label: 'Статьи', icon: 'manual' },
    { href: '/account/invitations', label: 'Приглашения', icon: 'invite' },
    { href: '/account/users', label: 'Пользователи', icon: 'clients' },
    { href: '/account/manage-certificates', label: 'Сертификаты', icon: 'certificate' },
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
    { href: '/account/certificates/create', label: 'Новый Сертификат', icon: 'certificate' },
    { href: '/account/payments', label: 'Платежи', icon: 'payments' },
    { href: '/account/chat', label: 'Чат', icon: 'chat' },
    { href: '/account/profile', label: 'Профиль', icon: 'profile' },
  ],
  manager: [
    { href: '/account', label: 'Главная', icon: 'home' },
    { href: '/account/requests', label: 'Заявки', icon: 'orders' },
    { href: '/account/access', label: 'Доступы', icon: 'clients' },
    { href: '/account/users', label: 'Пользователи', icon: 'clients' },
    { href: '/account/payments', label: 'Платежи', icon: 'payments' },
    { href: '/account/chat', label: 'Чат', icon: 'chat' },
    { href: '/account/profile', label: 'Профиль', icon: 'profile' },
  ],
  repairer: [
    { href: '/account', label: 'Главная', icon: 'home' },
    { href: '/account/requests', label: 'Заявка', icon: 'wrench' },
    { href: '/account/history', label: 'История', icon: 'history' },
    { href: '/account/man', label: 'Мануалы', icon: 'manual' },
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
