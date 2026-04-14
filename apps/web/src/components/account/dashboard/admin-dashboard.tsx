'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAccount } from '@/components/account/layout/provider';
import { getGreeting, displayName } from '@/lib/account';
import { StatCard, DonutChart, MetricComparison, ProgressBar } from '@asko/ui';
import { PageContainer } from '@/components/account/layout/page-container';
import { PageHeader } from '@/components/account/layout/page-header';
import { deviceApi } from '@/lib/api/device';
import { certificateApi } from '@/lib/api/certificate';
import { usersApi } from '@/lib/api/users';
import { invitationApi } from '@/lib/api/invitation';
import { paymentApi } from '@/lib/api/payment';
import { repairRequestApi } from '@/lib/api/repair-request';

const fmt = (n: number) => n.toLocaleString('ru-RU');

export function AdminDashboard() {
  const { user } = useAccount();
  const greeting = getGreeting();
  const [loading, setLoading] = useState(true);
  const [s, setS] = useState({
    devices: 0, certificates: 0, users: 0, invitations: 0,
    confirmedTotal: 0, refundedTotal: 0, confirmedCount: 0, refundedCount: 0,
    reqPending: 0, reqInProgress: 0, reqCompleted: 0, reqTotal: 0,
    certsActive: 0, certsExpired: 0, certsRevoked: 0,
  });

  useEffect(() => {
    (async () => {
      try {
        const [dev, cert, usr, inv, pay, rp, ri, rc, ra, ca, ce, cr] = await Promise.all([
          deviceApi.getAll({ limit: 1 }), certificateApi.getAll({ limit: 1 }),
          usersApi.getAll({ limit: 1 }), invitationApi.getAll(), paymentApi.getStats(),
          repairRequestApi.getAll({ limit: 1, status: 'pending' }),
          repairRequestApi.getAll({ limit: 1, status: 'in_progress' }),
          repairRequestApi.getAll({ limit: 1, status: 'completed' }),
          repairRequestApi.getAll({ limit: 1 }),
          certificateApi.getAll({ limit: 1, status: 'active' }),
          certificateApi.getAll({ limit: 1, status: 'expired' }),
          certificateApi.getAll({ limit: 1, status: 'revoked' }),
        ]);
        setS({
          devices: dev.data?.overallCount ?? 0, certificates: cert.data?.overallCount ?? 0,
          users: usr.data?.overallCount ?? 0, invitations: inv.data?.length ?? 0,
          confirmedTotal: pay.data?.confirmedTotal ?? 0, refundedTotal: pay.data?.refundedTotal ?? 0,
          confirmedCount: pay.data?.confirmedCount ?? 0, refundedCount: pay.data?.refundedCount ?? 0,
          reqPending: rp.data?.overallCount ?? 0, reqInProgress: ri.data?.overallCount ?? 0,
          reqCompleted: rc.data?.overallCount ?? 0, reqTotal: ra.data?.overallCount ?? 0,
          certsActive: ca.data?.overallCount ?? 0, certsExpired: ce.data?.overallCount ?? 0,
          certsRevoked: cr.data?.overallCount ?? 0,
        });
      } catch {} finally { setLoading(false); }
    })();
  }, []);

  const d = (v: number) => loading ? '-' : v;
  const totalPay = s.confirmedCount + s.refundedCount || 1;

  return (
    <PageContainer>
      <PageHeader size="large">{greeting},<br />{user && displayName(user)}!</PageHeader>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/account/devices"><StatCard size="compact" title="Товары" value={d(s.devices)} className="hover:border-text-main transition-colors h-full" /></Link>
        <Link href="/account/users"><StatCard size="compact" title="Пользователи" value={d(s.users)} className="hover:border-text-main transition-colors h-full" /></Link>
        <StatCard size="compact" title="Выручка" value={loading ? '-' : `${fmt(s.confirmedTotal)} ₽`} subtitle={`${d(s.confirmedCount)} платежей`} />
        <StatCard size="compact" title="Возвраты" value={loading ? '-' : `${fmt(s.refundedTotal)} ₽`} subtitle={`${d(s.refundedCount)} возвратов`} />
      </div>

      {/* Breakdown charts */}
      {!loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-surface border border-border shadow-sm p-6 flex flex-col gap-4">
            <h3 className="text-base font-medium text-text-main">Заявки на ремонт</h3>
            <div className="flex items-center gap-6">
              <DonutChart size={100} thickness={16} segments={[
                { value: s.reqPending, color: 'var(--color-warning)', label: 'Ожидание' },
                { value: s.reqInProgress, color: 'var(--color-info)', label: 'В работе' },
                { value: s.reqCompleted, color: 'var(--color-success)', label: 'Завершено' },
              ]} centerContent={<span className="text-lg font-bold text-text-main">{s.reqTotal}</span>} />
              <MetricComparison className="flex-1" items={[
                { label: 'Ожидание', value: s.reqPending, color: 'var(--color-warning)' },
                { label: 'В работе', value: s.reqInProgress, color: 'var(--color-info)' },
                { label: 'Завершено', value: s.reqCompleted, color: 'var(--color-success)' },
              ]} />
            </div>
          </div>
          <div className="bg-surface border border-border shadow-sm p-6 flex flex-col gap-4">
            <h3 className="text-base font-medium text-text-main">Сертификаты</h3>
            <div className="flex items-center gap-6">
              <DonutChart size={100} thickness={16} segments={[
                { value: s.certsActive, color: 'var(--color-success)', label: 'Активные' },
                { value: s.certsExpired, color: 'var(--color-text-muted)', label: 'Истекшие' },
                { value: s.certsRevoked, color: 'var(--color-error)', label: 'Отозванные' },
              ]} centerContent={<span className="text-lg font-bold text-text-main">{s.certificates}</span>} />
              <MetricComparison className="flex-1" items={[
                { label: 'Активные', value: s.certsActive, color: 'var(--color-success)' },
                { label: 'Истекшие', value: s.certsExpired, color: 'var(--color-text-muted)' },
                { label: 'Отозванные', value: s.certsRevoked, color: 'var(--color-error)' },
              ]} />
            </div>
          </div>
        </div>
      )}

      {/* Payment progress */}
      {!loading && s.confirmedCount > 0 && (
        <div className="bg-surface border border-border shadow-sm p-6 flex flex-col gap-3">
          <h3 className="text-base font-medium text-text-main">Финансы</h3>
          <ProgressBar value={(s.confirmedCount / totalPay) * 100} color="#22c55e" label="Успешные платежи" showValue size="lg" />
          <ProgressBar value={(s.refundedCount / totalPay) * 100} color="#ef4444" label="Возвраты" showValue size="lg" />
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/account/devices" className="flex items-center justify-center px-6 py-3 text-sm font-medium text-text-on-brand bg-brand-red">Управление товарами</Link>
        <Link href="/account/invitations" className="flex items-center justify-center px-6 py-3 text-sm font-medium text-text-on-brand bg-brand-red">Создать приглашение</Link>
        <Link href="/account/users" className="flex items-center justify-center px-6 py-3 text-sm font-medium text-text-on-brand bg-brand-red">Управление пользователями</Link>
        <Link href="/account/manage-certificates" className="flex items-center justify-center px-6 py-3 text-sm font-medium text-text-on-brand bg-brand-red">Проверка сертификатов</Link>
      </div>
    </PageContainer>
  );
}
