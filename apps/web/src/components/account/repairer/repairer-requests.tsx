'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, Badge, Button, TabList, Tab } from '@asko/ui';
import type { BadgeVariant } from '@asko/ui';
import { PageContainer } from '@/components/account/page-container';
import { PageHeader } from '@/components/account/page-header';
import { repairRequestApi } from '@/lib/api/repair-request';
import { RepairRequestStatus } from '@asko/shared/client';

type TabKey = 'active' | 'all' | 'paused' | 'completed';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'active', label: 'Активная' },
  { key: 'paused', label: 'Приостановленные' },
  { key: 'all', label: 'Все' },
  { key: 'completed', label: 'Завершенные' },
];

const STATUS_BADGE_VARIANT: Record<string, BadgeVariant> = {
  [RepairRequestStatus.ASSIGNED]: 'warning',
  [RepairRequestStatus.ACCEPTED]: 'warning',
  [RepairRequestStatus.IN_PROGRESS]: 'info',
  [RepairRequestStatus.PAUSED]: 'warning',
  [RepairRequestStatus.AWAITING_COMPLETION]: 'info',
  [RepairRequestStatus.COMPLETED]: 'neutral',
  [RepairRequestStatus.CANCELLED]: 'error',
  [RepairRequestStatus.REFUSED]: 'error',
};

const STATUS_LABELS: Record<string, string> = {
  [RepairRequestStatus.ASSIGNED]: 'Назначена',
  [RepairRequestStatus.ACCEPTED]: 'Принята',
  [RepairRequestStatus.IN_PROGRESS]: 'В работе',
  [RepairRequestStatus.PAUSED]: 'Приостановлена',
  [RepairRequestStatus.AWAITING_COMPLETION]: 'Ожидает завершения',
  [RepairRequestStatus.COMPLETED]: 'Завершена',
  [RepairRequestStatus.CANCELLED]: 'Отменена',
  [RepairRequestStatus.REFUSED]: 'Отказ',
};

const PAGE_SIZE = 12;

interface RepairRequest {
  id: string;
  description: string;
  status: RepairRequestStatus;
  user?: { firstName?: string; lastName?: string };
  userDevice?: { device?: { name?: string } };
  address?: { city?: string };
  createdAt: string;
  totalCost?: number;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function RequestCard({ request, highlight }: { request: RepairRequest; highlight?: boolean }) {
  const userName = [request.user?.lastName, request.user?.firstName].filter(Boolean).join(' ') || 'Клиент';
  const deviceName = request.userDevice?.device?.name || request.description;

  return (
    <Card padding="none" className={`p-5 flex flex-col gap-3 ${highlight ? 'ring-2 ring-brand-red' : ''}`}>
      <div className="flex items-center gap-2 text-xs text-text-sub">
        <span>{formatDate(request.createdAt)}</span>
        {request.address?.city && (
          <>
            <span>&bull;</span>
            <span>{request.address.city}</span>
          </>
        )}
      </div>
      <p className="text-sm font-medium text-text-main">{userName}</p>
      <p className="text-sm text-text-sub truncate">{deviceName}</p>
      <div className="flex items-center gap-2">
        <Badge variant={STATUS_BADGE_VARIANT[request.status] ?? 'neutral'} className="text-xs">
          {STATUS_LABELS[request.status] ?? request.status}
        </Badge>
        {request.totalCost != null && request.totalCost > 0 && (
          <span className="text-xs text-text-sub ml-auto">{request.totalCost.toLocaleString('ru-RU')} ₽</span>
        )}
      </div>
      <Link
        href={`/account/requests/${request.id}`}
        className="flex items-center gap-1 text-sm text-text-main hover:text-brand-red transition-colors mt-auto pt-2"
      >
        Открыть заявку
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
        </svg>
      </Link>
    </Card>
  );
}

export function RepairerRequests() {
  const [activeTab, setActiveTab] = useState<TabKey>('active');
  const [activeRequest, setActiveRequest] = useState<RepairRequest | null>(null);
  const [requests, setRequests] = useState<RepairRequest[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Fetch active request once
  useEffect(() => {
    repairRequestApi.getActive()
      .then(({ data }) => { if (data) setActiveRequest(data as unknown as RepairRequest); })
      .catch(() => {});
  }, []);

  // Fetch list based on tab + page
  useEffect(() => {
    setLoading(true);
    const params = { offset: page, limit: PAGE_SIZE };

    let promise;
    if (activeTab === 'paused') {
      promise = repairRequestApi.getPaused(params);
    } else if (activeTab === 'completed') {
      promise = repairRequestApi.getAssigned({ ...params, status: RepairRequestStatus.COMPLETED });
    } else {
      promise = repairRequestApi.getAssigned(params);
    }

    promise
      .then(({ data }) => {
        setRequests((data.data ?? []) as unknown as RepairRequest[]);
        setTotal(data.overallCount ?? 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [activeTab, page]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  // For the "active" tab, show active request prominently + rest of list
  const showActiveHighlight = activeTab === 'active' || activeTab === 'all';

  return (
    <PageContainer>
      <PageHeader>Мои заявки</PageHeader>

      <TabList>
        {TABS.map((tab) => (
          <Tab key={tab.key} active={activeTab === tab.key} onClick={() => { setActiveTab(tab.key); setPage(1); }}>
            {tab.label}
          </Tab>
        ))}
      </TabList>

      {/* Active request highlight */}
      {activeTab === 'active' && activeRequest && (
        <div className="mb-2">
          <p className="text-sm font-bold text-text-main mb-2">Текущая активная заявка</p>
          <RequestCard request={activeRequest} highlight />
        </div>
      )}

      {activeTab === 'active' && !activeRequest && !loading && (
        <Card className="text-text-sub text-sm">Нет активных заявок</Card>
      )}

      {/* List */}
      {activeTab !== 'active' && (
        <>
          {loading ? (
            <p className="text-sm text-text-sub">Загрузка...</p>
          ) : requests.length === 0 ? (
            <p className="text-sm text-text-sub">Нет заявок</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {requests.map((req) => (
                <RequestCard
                  key={req.id}
                  request={req}
                  highlight={showActiveHighlight && activeRequest?.id === req.id}
                />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button variant="secondary" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>
                Назад
              </Button>
              <span className="text-sm text-text-sub">{page} / {totalPages}</span>
              <Button variant="secondary" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
                Далее
              </Button>
            </div>
          )}
        </>
      )}
    </PageContainer>
  );
}
