'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAccount } from '@/components/account/layout/provider';
import { getGreeting, displayName } from '@/lib/account';
import { StatCard, DonutChart, MetricComparison, Sparkline } from '@asko/ui';
import { PageContainer } from '@/components/account/layout/page-container';
import { PageHeader } from '@/components/account/layout/page-header';
import { CTABanner } from '@/components/account/layout/cta-banner';
import { dealerApi } from '@/lib/api/dealer';
import { certificateApi } from '@/lib/api/certificate';
import type { IPointsTransaction } from '@/lib/api/types';

const fmt = (n: number) => n.toLocaleString('ru-RU');

export function DealerDashboard() {
  const { user } = useAccount();
  const greeting = getGreeting();
  const [loading, setLoading] = useState(true);
  const [s, setS] = useState({
    clients: 0, points: 0,
    certsTotal: 0, certsActive: 0, certsPending: 0,
    pointsHistory: [] as IPointsTransaction[],
  });

  useEffect(() => {
    (async () => {
      try {
        const [clients, profile, certs, certsActive, certsPending, pointsHist] = await Promise.all([
          dealerApi.getClients(),
          dealerApi.getProfile(),
          certificateApi.getDealer({ limit: 1 }),
          certificateApi.getDealer({ limit: 1, status: 'active' }),
          certificateApi.getDealer({ limit: 1, status: 'pending_payment' }),
          dealerApi.getPointsHistory({ limit: 30 }),
        ]);
        setS({
          clients: clients.data.clients?.length ?? 0,
          points: profile.data.profile?.pointsBalance ?? 0,
          certsTotal: certs.data?.overallCount ?? 0,
          certsActive: certsActive.data?.overallCount ?? 0,
          certsPending: certsPending.data?.overallCount ?? 0,
          pointsHistory: pointsHist.data?.data ?? [],
        });
      } catch {} finally { setLoading(false); }
    })();
  }, []);

  const d = (v: number) => loading ? '-' : v;
  const certsOther = Math.max(0, s.certsTotal - s.certsActive - s.certsPending);
  const sparkData = s.pointsHistory.slice().reverse().map(tx => tx.amount);

  return (
    <PageContainer>
      <PageHeader size="large">{greeting},<br />{user && displayName(user)}!</PageHeader>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard title="Баланс баллов" value={loading ? '-' : fmt(s.points)}>
          {!loading && sparkData.length > 2 && (
            <Sparkline data={sparkData} color="var(--color-success)" width={120} height={28} fill />
          )}
        </StatCard>
        <Link href="/account/certificates"><StatCard title="Сертификаты" value={d(s.certsTotal)} subtitle={`${d(s.certsActive)} активных`} className="hover:border-text-main transition-colors h-full" /></Link>
        <StatCard title="Мои клиенты" value={d(s.clients)} />
      </div>

      {/* Certificates breakdown */}
      {!loading && s.certsTotal > 0 && (
        <div className="bg-surface border border-border shadow-sm p-6 flex flex-col gap-4">
          <h3 className="text-base font-medium text-text-main">Статусы сертификатов</h3>
          <div className="flex items-center gap-6">
            <DonutChart size={100} thickness={16} segments={[
              { value: s.certsActive, color: 'var(--color-success)', label: 'Активные' },
              { value: s.certsPending, color: 'var(--color-warning)', label: 'Ожидание' },
              { value: certsOther, color: 'var(--color-text-muted)', label: 'Прочие' },
            ]} centerContent={<span className="text-lg font-bold text-text-main">{s.certsTotal}</span>} />
            <MetricComparison className="flex-1" items={[
              { label: 'Активные', value: s.certsActive, color: 'var(--color-success)' },
              { label: 'Ожидание', value: s.certsPending, color: 'var(--color-warning)' },
              { label: 'Прочие', value: certsOther, color: 'var(--color-text-muted)' },
            ]} />
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href="/account/certificates/create" className="flex items-center justify-center px-6 py-3 text-sm font-medium text-text-on-brand bg-brand-red">Создать сертификат</Link>
        <Link href="/account/payments" className="flex items-center justify-center px-6 py-3 text-sm font-medium text-text-on-brand bg-brand-red">Платежи и баллы</Link>
      </div>

      <CTABanner
        title={<>Необходимо выпустить<br />новый сертификат?</>}
        description="Создайте сертификат для клиента после продажи техники. Это позволит активировать гарантию и начислить бонусные баллы."
        linkHref="/account/certificates/create"
        linkLabel="Создать сертификат"
      />
    </PageContainer>
  );
}
