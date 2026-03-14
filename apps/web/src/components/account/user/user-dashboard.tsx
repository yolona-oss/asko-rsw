'use client';

import Link from 'next/link';
import { useAccount } from '@/components/account/account-provider';
import { getGreeting, displayName } from '@/lib/account';
import { Card, Button } from '@asko/ui';
import { PageContainer } from '@/components/account/page-container';
import { PageHeader } from '@/components/account/page-header';
import { CTABanner } from '@/components/account/cta-banner';

function StatCard({
  title,
  value,
  children,
}: {
  title: string;
  value?: string | number;
  children?: React.ReactNode;
}) {
  return (
    <Card className="flex flex-col gap-2">
      <span className="text-base font-medium leading-5 text-text-sub">{title}</span>
      {value !== undefined && (
        <span className="text-[56px] lg:text-[72px] font-normal leading-none text-text-main">
          {value}
        </span>
      )}
      {children}
    </Card>
  );
}

export function UserDashboard() {
  const { user } = useAccount();
  const greeting = getGreeting();

  return (
    <PageContainer>
      {/* Greeting */}
      <PageHeader size="large">
        {greeting},<br />
        {user && displayName(user)}!
      </PageHeader>

      {/* Stat cards - mobile stacked, desktop 3-col */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Мои заявки */}
        <StatCard title="Мои заявки:" value={0}>
          <div className="mt-auto pt-4 flex flex-col gap-1">
            <p className="text-sm font-bold text-text-main">Последняя заявка:</p>
            <p className="text-sm text-text-main">
              Ремонт стиральной машины ASKO W2086C
            </p>
            <Link
              href="/account/requests"
              className="text-sm text-text-sub underline mt-1 lg:hidden"
            >
              Смотреть все заявки...
            </Link>
          </div>
        </StatCard>

        {/* Активные сертификаты */}
        <StatCard title="Активные сертификаты:">
          <div className="flex items-center justify-end">
            <span className="text-[56px] lg:text-[72px] font-normal leading-none text-text-main">
              1
            </span>
          </div>
        </StatCard>

        {/* Счет на оплату */}
        <Card className="flex flex-col gap-3">
          <div className="flex items-baseline gap-2">
            <span className="text-base font-medium text-text-sub">Счет на оплату:</span>
            <span className="text-2xl font-bold text-text-main">14600</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-sm font-bold text-text-main">Статус:</span>
            <span className="text-sm text-brand-red">Ожидает оплаты...</span>
          </div>
          <Button
            variant="primary"
            className="mt-auto w-full lg:w-fit"
          >
            Оплатить
          </Button>
        </Card>
      </div>

      {/* Last request card - desktop only */}
      <div className="hidden lg:block">
        <Card className="flex items-start justify-between">
          <div className="flex flex-col gap-2">
            <p className="text-lg font-bold text-text-main">Последняя заявка:</p>
            <p className="text-base text-text-main">
              Ремонт стиральной машины ASKO W2086C
            </p>
            <Link
              href="/account/requests"
              className="text-sm text-text-sub underline mt-2"
            >
              Смотреть все заявки...
            </Link>
          </div>
          <div className="w-8 h-8 rounded-full bg-[#4ADE80] flex-shrink-0" />
        </Card>
      </div>

      {/* CTA Banner */}
      <CTABanner
        title={<>Возникла проблема<br />с техникой?</>}
        description="Создайте заявку, и наш специалист свяжется с вами для диагностики и согласования ремонта."
        linkHref="/account/requests/create"
        linkLabel="Создать заявку"
      />
    </PageContainer>
  );
}
