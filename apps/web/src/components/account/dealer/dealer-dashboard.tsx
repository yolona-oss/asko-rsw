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

        setClientsCount(clientsRes.data.clients?.length ?? 0);
        setPointsBalance(profileRes.data.profile?.pointsBalance ?? 0);
      } catch {
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
          <span className="text-[24px] font-medium leading-[28px] text-text-sub">Мои клиенты</span>
          <span className="text-[82px] font-normal leading-[86px] text-text-main">
            {loading ? '-' : clientsCount}
          </span>
        </Card>

        {/* Баланс баллов */}
        <Card className="flex flex-col gap-2">
          <span className="text-[24px] font-medium leading-[28px] text-text-sub">Баланс баллов</span>
          <span className="text-[82px] font-normal leading-[86px] text-text-main">
            {loading ? '-' : pointsBalance.toLocaleString('ru-RU')}
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
