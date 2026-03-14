'use client';

import Link from 'next/link';
import { useAccount } from '@/components/account/account-provider';
import { getGreeting, displayName } from '@/lib/account';
import { PageContainer } from '@/components/account/page-container';
import { PageHeader } from '@/components/account/page-header';

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
    <PageContainer>
      <PageHeader size="large">
        {greeting},<br />
        {user && displayName(user)}!
      </PageHeader>

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
    </PageContainer>
  );
}
