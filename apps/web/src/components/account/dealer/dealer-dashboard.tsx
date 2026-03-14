'use client';

import { useAccount } from '@/components/account/account-provider';
import { getGreeting, displayName } from '@/lib/account';
import { Card } from '@asko/ui';
import { PageContainer } from '@/components/account/page-container';
import { PageHeader } from '@/components/account/page-header';
import { CTABanner } from '@/components/account/cta-banner';

export function DealerDashboard() {
  const { user } = useAccount();
  const greeting = getGreeting();

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
            32
          </span>
        </Card>

        {/* Заработанные баллы */}
        <Card className="flex flex-col gap-2">
          <span className="text-base font-medium text-text-sub">Заработанные баллы</span>
          <span className="text-[72px] lg:text-[96px] font-normal leading-none text-text-main">
            3245
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
