'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAccount } from '@/components/account/account-provider';
import { getGreeting, displayName } from '@/lib/account';
import { Card, Button } from '@asko/ui';
import { PageContainer } from '@/components/account/page-container';
import { PageHeader } from '@/components/account/page-header';
import { CTABanner } from '@/components/account/cta-banner';
import { userApi } from '@/lib/api/user';
import type { RepairRequestStatus } from '@asko/shared/client';

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

interface RequestSummary {
  id: string;
  description: string;
  status: RepairRequestStatus;
}

export function UserDashboard() {
  const { user } = useAccount();
  const greeting = getGreeting();

  const [requestsCount, setRequestsCount] = useState<number>(0);
  const [certsCount, setCertsCount] = useState<number>(0);
  const [lastRequest, setLastRequest] = useState<RequestSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [reqRes, certRes] = await Promise.all([
          userApi.getMyRequests({ offset: 1, limit: 1 }),
          userApi.getMyCertificates(),
        ]);

        const reqData = reqRes.data;
        setRequestsCount(reqData.total ?? reqData.data?.length ?? 0);
        if (reqData.data?.length > 0) {
          const r = reqData.data[0];
          setLastRequest({ id: r.id, description: r.description, status: r.status });
        }

        const certs = Array.isArray(certRes.data) ? certRes.data : certRes.data?.data ?? [];
        setCertsCount(certs.filter((c: { status: string }) => c.status === 'active').length);
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

      {/* Stat cards - mobile stacked, desktop 3-col */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Мои заявки */}
        <StatCard title="Мои заявки:" value={loading ? '—' : requestsCount}>
          {lastRequest && (
            <div className="mt-auto pt-4 flex flex-col gap-1">
              <p className="text-sm font-bold text-text-main">Последняя заявка:</p>
              <p className="text-sm text-text-main">
                {lastRequest.description}
              </p>
              <Link
                href="/account/requests"
                className="text-sm text-text-sub underline mt-1 lg:hidden"
              >
                Смотреть все заявки...
              </Link>
            </div>
          )}
        </StatCard>

        {/* Активные сертификаты */}
        <StatCard title="Активные сертификаты:">
          <div className="flex items-center justify-end">
            <span className="text-[56px] lg:text-[72px] font-normal leading-none text-text-main">
              {loading ? '—' : certsCount}
            </span>
          </div>
        </StatCard>

        {/* Счет на оплату */}
        <Card className="flex flex-col gap-3">
          <div className="flex items-baseline gap-2">
            <span className="text-base font-medium text-text-sub">Счет на оплату:</span>
            <span className="text-2xl font-bold text-text-main">—</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-sm font-bold text-text-main">Статус:</span>
            <span className="text-sm text-text-sub">Нет активных счетов</span>
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
      {lastRequest && (
        <div className="hidden lg:block">
          <Card className="flex items-start justify-between">
            <div className="flex flex-col gap-2">
              <p className="text-lg font-bold text-text-main">Последняя заявка:</p>
              <p className="text-base text-text-main">
                {lastRequest.description}
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
      )}

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
