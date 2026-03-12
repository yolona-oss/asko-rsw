export type UserRole = 'user' | 'dealer' | 'manager';
export type LoadingStage = 'skeleton' | 'partial' | 'loaded';

export interface AccountUser {
  name: string;
  role: UserRole;
  avatar?: string;
  email?: string;
}

export interface MenuItem {
  href: string;
  label: string;
  icon: string; // icon key
}

export const menuByRole: Record<UserRole, MenuItem[]> = {
  user: [
    { href: '/account', label: 'Главная', icon: 'home' },
    { href: '/account/certificates', label: 'Сертификат', icon: 'certificate' },
    { href: '/account/payments', label: 'Платежи', icon: 'payments' },
    { href: '/account/profile', label: 'Профиль', icon: 'profile' },
  ],
  dealer: [
    { href: '/account', label: 'Главная', icon: 'home' },
    { href: '/account/certificates', label: 'Сертификат', icon: 'certificate' },
    { href: '/account/payments', label: 'Платежи', icon: 'payments' },
    { href: '/account/profile', label: 'Профиль', icon: 'profile' },
  ],
  manager: [
    { href: '/account', label: 'Главная', icon: 'home' },
    { href: '/account/requests', label: 'Заявки', icon: 'orders' },
    { href: '/account/access', label: 'Доступы', icon: 'clients' },
    { href: '/account/payments', label: 'Платежи', icon: 'payments' },
  ],
};

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 6) return 'Доброй ночи';
  if (hour < 12) return 'Доброе утро';
  if (hour < 18) return 'Добрый день';
  return 'Добрый вечер';
}
