'use client';

import { useState, useEffect } from 'react';
import { useAccount } from '@/components/account/account-provider';
import { getGreeting, displayName } from '@/lib/account';
import { Card } from '@asko/ui';
import { PageContainer } from '@/components/account/page-container';
import { PageHeader } from '@/components/account/page-header';
import { CTABanner } from '@/components/account/cta-banner';
import { dealerApi } from '@/lib/api/dealer';

export function DealerDashboard() {
  const { user } = useAccount();
  const greeting = getGreeting();

  const [clientsCount, setClientsCount] = useState<number>(0);
  const [pointsBalance, setPointsBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [clientsRes, profileRes] = await Promise.all([
          dealerApi.getClients(),
          dealerApi.getProfile(),
        ]);

        const clients = Array.isArray(clientsRes.data) ? clientsRes.data : [];
        setClientsCount(clients.length);
        setPointsBalance(profileRes.data?.pointsBalance ?? 0);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <PageContainer>
      {/* Greeting */}
      <PageHeader size="large">
        {greeting},<br />
        {user && displayName(user)}!
      </PageHeader>

      {/* Stat cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Мои клиенты */}
        <Card className="flex flex-col gap-2">
          <span className="text-base font-medium text-text-sub">Мои клиенты</span>
          <span className="text-[72px] lg:text-[96px] font-normal leading-none text-text-main">
            {loading ? '—' : clientsCount}
          </span>
        </Card>

        {/* Заработанные баллы */}
        <Card className="flex flex-col gap-2">
          <span className="text-base font-medium text-text-sub">Заработанные баллы</span>
          <span className="text-[72px] lg:text-[96px] font-normal leading-none text-text-main">
            {loading ? '—' : pointsBalance}
          </span>
        </Card>
      </div>

      {/* CTA Banner - create certificate */}
      <CTABanner
        title={<>Необходимо выпустить<br />новый сертификат?</>}
        description="Создайте сертификат для клиента после продажи техники. Это позволит активировать гарантию и начислить бонусные баллы."
        linkHref="/account/certificates/create"
        linkLabel="Создать заявку"
      />
    </PageContainer>
  );
}
