'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAccount } from '@/components/account/layout/provider';
import { getGreeting, displayName } from '@/lib/account';
import { StatCard, DonutChart, MetricComparison, ProgressBar } from '@asko/ui';
import { PageContainer } from '@/components/account/layout/page-container';
import { PageHeader } from '@/components/account/layout/page-header';
import { repairRequestApi } from '@/lib/api/repair-request';
import { paymentApi } from '@/lib/api/payment';

const fmt = (n: number) => n.toLocaleString('ru-RU');

export function ManagerDashboard() {
  const { user } = useAccount();
  const greeting = getGreeting();
  const [loading, setLoading] = useState(true);
  const [s, setS] = useState({
    reqPending: 0, reqAssigned: 0, reqInProgress: 0, reqCompleted: 0, reqTotal: 0,
    confirmedTotal: 0, refundedTotal: 0, confirmedCount: 0, refundedCount: 0,
    pendingPayments: 0,
  });

  useEffect(() => {
    (async () => {
      try {
        const [rp, ras, ri, rc, ra, pay, pp] = await Promise.all([
          repairRequestApi.getAll({ limit: 1, status: 'pending' }),
          repairRequestApi.getAll({ limit: 1, status: 'assigned' }),
          repairRequestApi.getAll({ limit: 1, status: 'in_progress' }),
          repairRequestApi.getAll({ limit: 1, status: 'completed' }),
          repairRequestApi.getAll({ limit: 1 }),
          paymentApi.getStats(),
          paymentApi.listPayments({ limit: 1, status: 'pending' }),
        ]);
        setS({
          reqPending: rp.data?.overallCount ?? 0, reqAssigned: ras.data?.overallCount ?? 0,
          reqInProgress: ri.data?.overallCount ?? 0, reqCompleted: rc.data?.overallCount ?? 0,
          reqTotal: ra.data?.overallCount ?? 0,
          confirmedTotal: pay.data?.confirmedTotal ?? 0, refundedTotal: pay.data?.refundedTotal ?? 0,
          confirmedCount: pay.data?.confirmedCount ?? 0, refundedCount: pay.data?.refundedCount ?? 0,
          pendingPayments: pp.data?.overallCount ?? 0,
        });
      } catch {} finally { setLoading(false); }
    })();
  }, []);

  const d = (v: number) => loading ? '-' : v;

  return (
    <PageContainer>
      <PageHeader size="large">{greeting},<br />{user && displayName(user)}!</PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/account/requests"><StatCard title="Всего заявок" value={d(s.reqTotal)} className="hover:border-text-main transition-colors h-full" /></Link>
        <StatCard title="Ожидают назначения" value={d(s.reqPending)} subtitle={s.reqPending > 0 && !loading ? 'Требуют внимания' : undefined} />
        <StatCard title="Выручка" value={loading ? '-' : `${fmt(s.confirmedTotal)} ₽`} subtitle={`${d(s.confirmedCount)} платежей`} />
        <StatCard title="Ожидают оплаты" value={d(s.pendingPayments)} />
      </div>

      {!loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-surface border border-border shadow-sm p-6 flex flex-col gap-4">
            <h3 className="text-base font-medium text-text-main">Статусы заявок</h3>
            <div className="flex items-center gap-6">
              <DonutChart size={100} thickness={16} segments={[
                { value: s.reqPending, color: '#f59e0b', label: 'Ожидание' },
                { value: s.reqAssigned, color: '#8b5cf6', label: 'Назначен' },
                { value: s.reqInProgress, color: '#3b82f6', label: 'В работе' },
                { value: s.reqCompleted, color: '#22c55e', label: 'Завершено' },
              ]} centerContent={<span className="text-lg font-bold text-text-main">{s.reqTotal}</span>} />
              <MetricComparison className="flex-1" items={[
                { label: 'Ожидание', value: s.reqPending, color: '#f59e0b' },
                { label: 'Назначен', value: s.reqAssigned, color: '#8b5cf6' },
                { label: 'В работе', value: s.reqInProgress, color: '#3b82f6' },
                { label: 'Завершено', value: s.reqCompleted, color: '#22c55e' },
              ]} />
            </div>
          </div>

          <div className="bg-surface border border-border shadow-sm p-6 flex flex-col gap-4">
            <h3 className="text-base font-medium text-text-main">Финансы</h3>
            <ProgressBar value={s.confirmedCount / ((s.confirmedCount + s.refundedCount) || 1) * 100} color="#22c55e" label={`Подтверждено: ${fmt(s.confirmedTotal)} ₽`} showValue size="lg" />
            <ProgressBar value={s.refundedCount / ((s.confirmedCount + s.refundedCount) || 1) * 100} color="#ef4444" label={`Возвращено: ${fmt(s.refundedTotal)} ₽`} showValue size="lg" />
            <ProgressBar value={s.reqCompleted / (s.reqTotal || 1) * 100} color="#3b82f6" label="Процент завершения заявок" showValue size="lg" />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link href="/account/requests" className="flex items-center justify-center px-6 py-3 text-sm font-medium text-white bg-brand-red">Управление заявками</Link>
        <Link href="/account/users" className="flex items-center justify-center px-6 py-3 text-sm font-medium text-white bg-brand-red">Выдача доступов</Link>
        <Link href="/account/payments" className="flex items-center justify-center px-6 py-3 text-sm font-medium text-white bg-brand-red">Платежи</Link>
      </div>
    </PageContainer>
  );
}
