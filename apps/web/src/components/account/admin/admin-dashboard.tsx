'use client';

import Link from 'next/link';
import { useAccount } from '@/components/account/account-provider';
import { getGreeting, displayName } from '@/lib/account';

function StatCard({ title, value, href }: { title: string; value: number; href: string }) {
  return (
    <Link
      href={href}
      className="bg-white rounded-sm border border-border-light p-6 flex flex-col gap-2 hover:border-text-main transition-colors"
    >
      <span className="text-base font-medium leading-5 text-text-sub">{title}</span>
      <span className="text-[56px] lg:text-[72px] font-normal leading-none text-text-main">
        {value}
      </span>
    </Link>
  );
}

export function AdminDashboard() {
  const { user } = useAccount();
  const greeting = getGreeting();

  return (
    <div className="p-4 lg:p-8 flex flex-col gap-6 lg:gap-8">
      <h1 className="text-[32px] lg:text-[42px] font-medium leading-tight tracking-[-0.01em] text-text-main">
        {greeting},<br />
        {user && displayName(user)}!
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <StatCard title="Товары:" value={12} href="/account/devices" />
        <StatCard title="Ожидают проверки:" value={3} href="/account/manage-certificates" />
        <StatCard title="Активные пользователи:" value={48} href="/account/users" />
        <StatCard title="Приглашения:" value={5} href="/account/invitations" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <Link
          href="/account/devices"
          className="flex items-center justify-center px-6 py-3 text-sm font-medium text-white bg-brand-red cursor-pointer"
        >
          Управление товарами
        </Link>
        <Link
          href="/account/invitations"
          className="flex items-center justify-center px-6 py-3 text-sm font-medium text-white bg-brand-red cursor-pointer"
        >
          Создать приглашение
        </Link>
        <Link
          href="/account/users"
          className="flex items-center justify-center px-6 py-3 text-sm font-medium text-white bg-brand-red cursor-pointer"
        >
          Управление пользователями
        </Link>
        <Link
          href="/account/manage-certificates"
          className="flex items-center justify-center px-6 py-3 text-sm font-medium text-white bg-brand-red cursor-pointer"
        >
          Проверка сертификатов
        </Link>
      </div>
    </div>
  );
}
