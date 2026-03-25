'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Card,
  Badge,
  Button,
  ViewSwitcher,
  VIEW_TABLE,
  VIEW_CARD,
  DataSearch,
  DataFilter,
  DataTable,
  DataTableHeader,
  DataTableRow,
  DataTableCell,
  DataTableEmpty,
  DataTableFooter,
} from '@asko/ui';
import type { BadgeVariant, FilterDefinition, FilterValues } from '@asko/ui';
import { PageContainer } from '@/components/account/page-container';
import { PageHeader } from '@/components/account/page-header';
import { repairRequestApi } from '@/lib/api/repair-request';
import { RepairRequestStatus } from '@asko/shared/client';

type TabKey = 'active' | 'all' | 'paused' | 'completed';

const TAB_FILTER: FilterDefinition = {
  key: 'tab',
  label: '',
  type: 'tabs',
  options: [
    { value: 'active', label: 'Активная' },
    { value: 'paused', label: 'Приостановленные' },
    { value: 'all', label: 'Все' },
    { value: 'completed', label: 'Завершенные' },
  ],
};

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
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs text-text-sub">
          <span>{formatDate(request.createdAt)}</span>
          {request.address?.city && (
            <>
              <span>&bull;</span>
              <span>{request.address.city}</span>
            </>
          )}
        </div>
        <Badge variant={STATUS_BADGE_VARIANT[request.status] ?? 'neutral'} className="text-xs">
          {STATUS_LABELS[request.status] ?? request.status}
        </Badge>
      </div>
      <p className="text-sm font-medium text-text-main">{userName}</p>
      <p className="text-sm text-text-sub truncate">{deviceName}</p>
      {request.totalCost != null && request.totalCost > 0 && (
        <span className="text-xs text-text-sub">{request.totalCost.toLocaleString('ru-RU')} ₽</span>
      )}
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

function RequestTableRow({ request, highlight }: { request: RepairRequest; highlight?: boolean }) {
  const userName = [request.user?.lastName, request.user?.firstName].filter(Boolean).join(' ') || 'Клиент';
  const deviceName = request.userDevice?.device?.name || request.description;

  return (
    <DataTableRow className={highlight ? 'bg-brand-red/5' : undefined}>
      <DataTableCell mobileLabel="Клиент:" className="lg:w-[180px] lg:flex-shrink-0">
        <p className="text-sm font-medium text-text-main">{userName}</p>
      </DataTableCell>
      <DataTableCell mobileLabel="Устройство:" className="lg:flex-1 lg:px-4">
        <p className="text-sm text-text-main truncate">{deviceName}</p>
      </DataTableCell>
      <DataTableCell mobileLabel="Город:" className="lg:w-[120px] lg:px-4">
        <p className="text-sm text-text-main">{request.address?.city ?? '—'}</p>
      </DataTableCell>
      <DataTableCell mobileLabel="Статус:" className="lg:w-[160px] lg:px-4">
        <Badge variant={STATUS_BADGE_VARIANT[request.status] ?? 'neutral'} className="text-xs">
          {STATUS_LABELS[request.status] ?? request.status}
        </Badge>
      </DataTableCell>
      <DataTableCell mobileLabel="Стоимость:" className="lg:w-[100px] lg:px-4">
        <p className="text-sm text-text-main">
          {request.totalCost != null && request.totalCost > 0 ? `${request.totalCost.toLocaleString('ru-RU')} ₽` : '—'}
        </p>
      </DataTableCell>
      <DataTableCell mobileLabel="Дата:" className="lg:w-[140px] lg:px-4">
        <p className="text-sm text-text-main">{formatDate(request.createdAt)}</p>
      </DataTableCell>
      <DataTableCell className="lg:w-[120px] lg:flex-shrink-0 lg:text-right">
        <Link
          href={`/account/requests/${request.id}`}
          className="text-sm text-text-main hover:text-brand-red transition-colors flex items-center gap-1"
        >
          Открыть
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </Link>
      </DataTableCell>
    </DataTableRow>
  );
}

export function RepairerRequests() {
  const [filterValues, setFilterValues] = useState<FilterValues>({ tab: 'active' });
  const activeTab = filterValues.tab as TabKey;
  const [activeRequest, setActiveRequest] = useState<RepairRequest | null>(null);
  const [requests, setRequests] = useState<RepairRequest[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('card');
  const [search, setSearch] = useState('');

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
  const showActiveHighlight = activeTab === 'active' || activeTab === 'all';

  const handleFilterChange = (key: string, value: string) => {
    setFilterValues((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  // Client-side search filter
  const filteredRequests = (() => {
    if (!search.trim()) return requests;
    const q = search.trim().toLowerCase();
    return requests.filter((r) => {
      const userName = [r.user?.lastName, r.user?.firstName].filter(Boolean).join(' ').toLowerCase();
      const deviceName = (r.userDevice?.device?.name ?? '').toLowerCase();
      const city = (r.address?.city ?? '').toLowerCase();
      return userName.includes(q) || deviceName.includes(q) || city.includes(q);
    });
  })();

  return (
    <PageContainer>
      <PageHeader>Мои заявки</PageHeader>

      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row gap-4 items-stretch">
        <DataSearch value={search} onChange={setSearch} placeholder="Поиск по клиенту, устройству или городу" className="lg:w-[320px] flex-shrink-0" />
        <div className="flex-1 flex items-center gap-3">
          <DataFilter
            filters={[TAB_FILTER]}
            values={filterValues}
            onChange={handleFilterChange}
          />
          <div className="ml-auto flex-shrink-0 flex items-center gap-2">
            <ViewSwitcher views={[VIEW_TABLE, VIEW_CARD]} activeView={view} onViewChange={setView} />
          </div>
        </div>
      </div>

      {/* Active request highlight */}
      {activeTab === 'active' && activeRequest && (
        <div className="mb-2">
          <p className="text-sm font-bold text-text-main mb-2">Текущая активная заявка</p>
          {view === 'card' ? (
            <RequestCard request={activeRequest} highlight />
          ) : (
            <DataTable>
              <DataTableHeader>
                <div className="w-[180px] flex-shrink-0">Клиент</div>
                <div className="flex-1 px-4">Устройство</div>
                <div className="w-[120px] px-4">Город</div>
                <div className="w-[160px] px-4">Статус</div>
                <div className="w-[100px] px-4">Стоимость</div>
                <div className="w-[140px] px-4">Дата</div>
                <div className="w-[120px] flex-shrink-0" />
              </DataTableHeader>
              <RequestTableRow request={activeRequest} highlight />
            </DataTable>
          )}
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
          ) : filteredRequests.length === 0 ? (
            <p className="text-sm text-text-sub">Нет заявок</p>
          ) : view === 'card' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredRequests.map((req) => (
                <RequestCard
                  key={req.id}
                  request={req}
                  highlight={showActiveHighlight && activeRequest?.id === req.id}
                />
              ))}
            </div>
          ) : (
            <DataTable>
              <DataTableHeader>
                <div className="w-[180px] flex-shrink-0">Клиент</div>
                <div className="flex-1 px-4">Устройство</div>
                <div className="w-[120px] px-4">Город</div>
                <div className="w-[160px] px-4">Статус</div>
                <div className="w-[100px] px-4">Стоимость</div>
                <div className="w-[140px] px-4">Дата</div>
                <div className="w-[120px] flex-shrink-0" />
              </DataTableHeader>
              {filteredRequests.map((req) => (
                <RequestTableRow
                  key={req.id}
                  request={req}
                  highlight={showActiveHighlight && activeRequest?.id === req.id}
                />
              ))}
              <DataTableFooter>
                Показано {filteredRequests.length} из {total}
              </DataTableFooter>
            </DataTable>
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
