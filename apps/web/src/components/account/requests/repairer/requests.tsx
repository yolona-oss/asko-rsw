'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useEntityDetail } from '@/hooks/use-entity-detail';
import { EntityDetailModal } from '@/components/account/_shared/entity-detail-modal';
import { RepairRequestDetail, fetchRepairRequestOne } from '@/components/account/requests/shared/repair-request-detail';
import {
  Badge,
  DataToolbar,
  DataGrid,
  ViewSwitcher,
  VIEW_TABLE,
  VIEW_CARD,
  Pagination,
} from '@asko/ui';
import type { FilterValues, DataGridColumn, SortOrder } from '@asko/ui';
import { PageContainer } from '@/components/account/layout/page-container';
import { PageHeader } from '@/components/account/layout/page-header';
import { repairRequestApi } from '@/lib/api/repair-request';
import { PaymentStatusBadge } from '@/components/account/payments/shared/payment-status-badge';
import { RepairRequestStatus } from '@asko/shared/client';
import { formatDateTime } from '@asko/shared/client';
import { TAB_FILTER, PAGE_SIZE, STATUS_BADGE_VARIANT, STATUS_LABELS } from './list-constants';
import type { TabKey } from './list-constants';
import type { RepairRequest } from './list-types';
import { RequestCard } from './request-card';

function useRequestColumns(paymentsMap: Record<string, any[]>): DataGridColumn<RepairRequest>[] {
  return useMemo(() => [
    {
      key: 'client',
      header: 'Клиент',
      sortable: false,
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
      sortable: false,
      mobileLabel: 'Устройство:',
      render: (request) => {
        const deviceName = request.userDevice?.device?.name || request.description;
        return <p className="text-sm text-text-main truncate">{deviceName}</p>;
      },
    },
    {
      key: 'city',
      header: 'Город',
      sortable: false,
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
      sortField: 'totalCost',
      width: 160,
      mobileLabel: 'Стоимость:',
      render: (request) => (
        <span className="inline-flex items-center gap-1.5">
          <span className="text-sm text-text-main">
            {request.totalCost != null && request.totalCost > 0 ? `${request.totalCost.toLocaleString('ru-RU')} ₽` : '-'}
          </span>
          <PaymentStatusBadge payments={paymentsMap[request.id]} className="text-xs" />
        </span>
      ),
    },
    {
      key: 'date',
      header: 'Дата',
      sortField: 'createdAt',
      width: 140,
      mobileLabel: 'Дата:',
      render: (request) => (
        <p className="text-sm text-text-main">{formatDateTime(request.createdAt)}</p>
      ),
    },
  ], [paymentsMap]);
}

export function RepairerRequests() {
  const router = useRouter();
  const detail = useEntityDetail<RepairRequest>();
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
  const [paymentsMap, setPaymentsMap] = useState<Record<string, any[]>>({});

  const columns = useRequestColumns(paymentsMap);

  // Fetch active request once
  useEffect(() => {
    repairRequestApi.getActive()
      .then(({ data }) => {
        if (data?.id) setActiveRequest(data);
      })
      .catch(() => { });
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
      if (activeTab === 'completed') {
        result = await repairRequestApi.getAssigned({ ...params, status: RepairRequestStatus.COMPLETED });
      } else {
        result = await repairRequestApi.getAssigned(params);
      }

      const items = result.data.data ?? [];
      setRequests(items);
      setTotal(result.data.overallCount ?? 0);

      // Fetch payment info for requests with cost
      const withCost = items.filter(r => r.totalCost != null && r.totalCost > 0);
      if (withCost.length > 0) {
        const pMap: Record<string, any[]> = {};
        await Promise.all(withCost.map(async (r) => {
          try {
            const { data: payments } = await repairRequestApi.getPayments(r.id);
            pMap[r.id] = payments.payments ?? [];
          } catch { /* skip */ }
        }));
        setPaymentsMap(pMap);
      } else {
        setPaymentsMap({});
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }, [page, activeTab, search, sortBy, sortOrder]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const showActiveHighlight = activeTab === 'active';

  const handleFilterChange = (key: string, value: string | string[]) => {
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
        viewSwitcher={<ViewSwitcher views={[VIEW_TABLE, VIEW_CARD]} activeView={view} onViewChange={setView} />}
      />

      {/* List */}
      {view === 'table' ? (
        <DataGrid
          loading={loading}
          columns={columns}
          data={requests}
          keyExtractor={(req) => req.id}
          emptyContent="Нет заявок"
          sortKey={sortBy ?? undefined}
          sortOrder={sortOrder ?? undefined}
          onSort={(key, order) => { setSortBy(key); setSortOrder(order); setPage(1); }}
          onRowClick={detail.onRowClick}
          onRowDoubleClick={(req) => router.push(`/account/requests/${req.id}`)}
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
      ) : loading ? (
        <p className="text-sm text-text-sub">Загрузка...</p>
      ) : requests.length === 0 ? (
        <p className="text-sm text-text-sub">Нет заявок</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {requests.map((req) => (
            <RequestCard
              key={req.id}
              request={req}
              payments={paymentsMap[req.id]}
              highlight={showActiveHighlight && activeRequest?.id === req.id}
              onClick={() => detail.onRowClick(req)}
              onDoubleClick={() => router.push(`/account/requests/${req.id}`)}
            />
          ))}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} className="justify-center mt-6" />
      <EntityDetailModal
        open={detail.open}
        onClose={detail.onClose}
        item={detail.selectedItem}
        title="Детали заявки"
        fetchOne={fetchRepairRequestOne}
        renderContent={(item, loading) => <RepairRequestDetail item={item} loading={loading} />}
        onEdit={(item) => router.push(`/account/requests/${item.id}`)}
      />
    </PageContainer>
  );
}
