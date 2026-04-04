'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  Card,
  Badge,
  DataToolbar,
  DataGrid,
  VIEW_TABLE,
  VIEW_CARD,
  Pagination,
} from '@asko/ui';
import type { FilterValues, DataGridColumn, SortOrder } from '@asko/ui';
import { PageContainer } from '@/components/account/page-container';
import { PageHeader } from '@/components/account/page-header';
import { repairRequestApi } from '@/lib/api/repair-request';
import { RepairRequestStatus } from '@asko/shared/client';
import { TAB_FILTER, PAGE_SIZE, STATUS_BADGE_VARIANT, STATUS_LABELS, formatDate } from './constants';
import type { TabKey } from './constants';
import type { RepairRequest } from './types';
import { RequestCard } from './request-card';

function useRequestColumns(): DataGridColumn<RepairRequest>[] {
  return useMemo(() => [
    {
      key: 'client',
      header: 'Клиент',
      width: 180,
      mobileLabel: 'Клиент:',
      render: (request) => {
        const userName = [request.user?.lastName, request.user?.firstName].filter(Boolean).join(' ') || 'Клиент';
        return <p className="text-sm font-medium text-text-main">{userName}</p>;
      },
    },
    {
      key: 'device',
      header: 'Устройство',
      mobileLabel: 'Устройство:',
      render: (request) => {
        const deviceName = request.userDevice?.device?.name || request.description;
        return <p className="text-sm text-text-main truncate">{deviceName}</p>;
      },
    },
    {
      key: 'city',
      header: 'Город',
      width: 120,
      mobileLabel: 'Город:',
      render: (request) => (
        <p className="text-sm text-text-main">{request.address?.city ?? '-'}</p>
      ),
    },
    {
      key: 'status',
      header: 'Статус',
      width: 160,
      mobileLabel: 'Статус:',
      render: (request) => (
        <Badge variant={STATUS_BADGE_VARIANT[request.status] ?? 'neutral'} className="text-xs">
          {STATUS_LABELS[request.status] ?? request.status}
        </Badge>
      ),
    },
    {
      key: 'cost',
      header: 'Стоимость',
      width: 100,
      mobileLabel: 'Стоимость:',
      render: (request) => (
        <p className="text-sm text-text-main">
          {request.totalCost != null && request.totalCost > 0 ? `${request.totalCost.toLocaleString('ru-RU')} ₽` : '-'}
        </p>
      ),
    },
    {
      key: 'date',
      header: 'Дата',
      width: 140,
      mobileLabel: 'Дата:',
      render: (request) => (
        <p className="text-sm text-text-main">{formatDate(request.createdAt)}</p>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: 120,
      sortable: false,
      render: (request) => (
        <Link
          href={`/account/requests/${request.id}`}
          className="text-sm text-text-main hover:text-brand-red transition-colors flex items-center gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          Открыть
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </Link>
      ),
    },
  ], []);
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
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder | null>(null);

  const columns = useRequestColumns();

  // Fetch active request once
  useEffect(() => {
    repairRequestApi.getActive()
      .then(({ data }) => {
        const req = (data as any)?.request ?? data;
        if (req?.id) setActiveRequest(req as unknown as RepairRequest);
      })
      .catch(() => {});
  }, []);

  // Fetch list based on tab
  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: page,
        limit: PAGE_SIZE,
        search: search || undefined,
        sortBy: sortBy ?? undefined,
        sortOrder: sortOrder ?? undefined,
      };

      let result;
      if (activeTab === 'paused') {
        result = await repairRequestApi.getPaused(params);
      } else if (activeTab === 'completed') {
        result = await repairRequestApi.getAssigned({ ...params, status: RepairRequestStatus.COMPLETED });
      } else {
        result = await repairRequestApi.getAssigned(params);
      }

      setRequests((result.data.data ?? []) as unknown as RepairRequest[]);
      setTotal(result.data.overallCount ?? 0);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [page, activeTab, search, sortBy, sortOrder]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const showActiveHighlight = activeTab === 'active' || activeTab === 'all';

  const handleFilterChange = (key: string, value: string) => {
    setFilterValues((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <PageContainer>
      <PageHeader>Мои заявки</PageHeader>

      {/* Toolbar */}
      <DataToolbar
        search={{ value: search, onChange: handleSearchChange, placeholder: "Поиск по клиенту, устройству или городу" }}
        filters={[TAB_FILTER]}
        filterValues={filterValues}
        onFilterChange={handleFilterChange}
        views={[VIEW_TABLE, VIEW_CARD]}
        activeView={view}
        onViewChange={setView}
      />

      {/* Active request highlight */}
      {activeTab === 'active' && activeRequest && (
        <div className="mb-2">
          <p className="text-sm font-bold text-text-main mb-2">Текущая активная заявка</p>
          {view === 'card' ? (
            <RequestCard request={activeRequest} highlight />
          ) : (
            <DataGrid
              columns={columns}
              data={[activeRequest]}
              keyExtractor={(req) => req.id}
              rowClassName={() => 'bg-brand-red/5'}
            />
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
          ) : requests.length === 0 ? (
            <p className="text-sm text-text-sub">Нет заявок</p>
          ) : view === 'card' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {requests.map((req) => (
                <RequestCard
                  key={req.id}
                  request={req}
                  highlight={showActiveHighlight && activeRequest?.id === req.id}
                />
              ))}
            </div>
          ) : (
            <DataGrid
              columns={columns}
              data={requests}
              keyExtractor={(req) => req.id}
              sortKey={sortBy ?? undefined}
              sortOrder={sortOrder ?? undefined}
              onSort={(key, order) => { setSortBy(key); setSortOrder(order); setPage(1); }}
              rowClassName={(req) =>
                showActiveHighlight && activeRequest?.id === req.id ? 'bg-brand-red/5' : undefined
              }
              footer={
                <div className="flex items-center justify-between w-full">
                  <span>Показано {requests.length} из {total}</span>
                  <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
                </div>
              }
            />
          )}

          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} className="justify-center mt-6" />
        </>
      )}
    </PageContainer>
  );
}
