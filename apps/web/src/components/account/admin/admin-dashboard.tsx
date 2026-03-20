'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAccount } from '@/components/account/account-provider';
import { getGreeting, displayName } from '@/lib/account';
import { PageContainer } from '@/components/account/page-container';
import { PageHeader } from '@/components/account/page-header';
import { adminApi } from '@/lib/api/admin';

function StatCard({ title, value, href }: { title: string; value: number | string; href: string }) {
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

  const [stats, setStats] = useState({ devices: 0, pending: 0, users: 0, invitations: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [devicesRes, pendingRes, usersRes, invitationsRes] = await Promise.all([
          adminApi.getDevices({ limit: 1 }),
          adminApi.getPendingCertificates({ limit: 1 }),
          adminApi.getUsers({ limit: 1 }),
          adminApi.getInvitations(),
        ]);

        setStats({
          devices: devicesRes.data?.total ?? 0,
          pending: pendingRes.data?.total ?? 0,
          users: usersRes.data?.overallCount ?? 0,
          invitations: invitationsRes.data?.length ?? 0,
        });
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const display = (v: number) => loading ? '-' : v;

  return (
    <PageContainer>
      <PageHeader size="large">
        {greeting},<br />
        {user && displayName(user)}!
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <StatCard title="Товары:" value={display(stats.devices)} href="/account/devices" />
        <StatCard title="Ожидают проверки:" value={display(stats.pending)} href="/account/manage-certificates" />
        <StatCard title="Активные пользователи:" value={display(stats.users)} href="/account/users" />
        <StatCard title="Приглашения:" value={display(stats.invitations)} href="/account/invitations" />
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
