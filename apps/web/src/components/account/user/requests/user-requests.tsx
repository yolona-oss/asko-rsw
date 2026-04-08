'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEntityDetail } from '@/hooks/use-entity-detail';
import { EntityDetailModal } from '@/components/account/shared/entity-detail-modal';
import { RepairRequestDetail, fetchRepairRequestOne } from '@/components/account/shared/repair-request-detail';
import {
  Badge,
  Button,
  DataToolbar,
  ViewSwitcher,
  VIEW_TABLE,
  VIEW_CARD,
  DataGrid,
  Pagination,
  SkeletonCard,
  filterValueToParam,
} from '@asko/ui';
import type { DataGridColumn, FilterValues, SortOrder } from '@asko/ui';
import { PageContainer } from '@/components/account/layout/page-container';
import { PageHeader } from '@/components/account/layout/page-header';
import { repairRequestApi } from '@/lib/api/repair-request';
import { STATUS_LABELS, STATUS_BADGE_VARIANT, formatDate, STATUS_FILTER, type StatusFilter } from './constants';
import type { RepairRequest } from './types';
import { RequestCard } from './request-card';

const PAGE_SIZE = 20;

export function UserRequests() {
  const router = useRouter();
  const detail = useEntityDetail<RepairRequest>();
  const [requests, setRequests] = useState<RepairRequest[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('card');
  const [search, setSearch] = useState('');
  const [filterValues, setFilterValues] = useState<FilterValues>({ status: '' });
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder | null>(null);

  const statusFilter = filterValues.status as StatusFilter;

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await repairRequestApi.getMy({
        page: page,
        limit: PAGE_SIZE,
        search: search || undefined,
        status: filterValueToParam(filterValues, 'status'),
        sortBy: sortBy ?? undefined,
        sortOrder: sortOrder ?? undefined,
      });
      setRequests((data.data ?? []) as unknown as RepairRequest[]);
      setTotal(data.overallCount ?? 0);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, sortBy, sortOrder]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const requestColumns: DataGridColumn<RepairRequest>[] = [
    {
      key: 'device',
      header: 'Устройство',
      sortable: false,
      width: 200,
      mobileLabel: 'Устройство:',
      render: (req) => (
        <p className="text-sm font-medium text-text-main">{req.userDevice?.device?.name ?? 'Устройство'}</p>
      ),
    },
    {
      key: 'description',
      header: 'Описание',
      sortable: false,
      mobileLabel: 'Описание:',
      render: (req) => <p className="text-sm text-text-main truncate">{req.description}</p>,
    },
    {
      key: 'status',
      header: 'Статус',
      width: 160,
      mobileLabel: 'Статус:',
      render: (req) => (
        <Badge variant={STATUS_BADGE_VARIANT[req.status] ?? 'neutral'} className="text-xs">
          {STATUS_LABELS[req.status] ?? req.status}
        </Badge>
      ),
    },
    {
      key: 'date',
      header: 'Дата',
      sortField: 'createdAt',
      width: 120,
      mobileLabel: 'Дата:',
      render: (req) => <p className="text-sm text-text-main">{formatDate(req.createdAt)}</p>,
    },
  ];

  const handleFilterChange = (key: string, value: string | string[]) => {
    setFilterValues((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  return (
    <PageContainer>
      <PageHeader>Мои заявки</PageHeader>

      {/* Toolbar */}
      <DataToolbar
        search={{ value: search, onChange: handleSearchChange, placeholder: "Поиск по устройству или описанию" }}
        filters={[STATUS_FILTER]}
        filterValues={filterValues}
        onFilterChange={handleFilterChange}
        actions={
          <Link href="/account/requests/create">
            <Button variant="primary">Создать заявку</Button>
          </Link>
        }
        viewSwitcher={<ViewSwitcher views={[VIEW_TABLE, VIEW_CARD]} activeView={view} onViewChange={setView} />}
      />

      {/* Data */}
      {view === 'table' ? (
        <DataGrid<RepairRequest>
          loading={loading}
          columns={requestColumns}
          data={requests}
          keyExtractor={(req) => req.id}
          emptyContent={
            total === 0 && !search && !statusFilter ? (
              <div className="flex flex-col items-center gap-4 py-4">
                <p className="text-base text-text-sub">У вас пока нет заявок</p>
                <Link href="/account/requests/create">
                  <Button variant="primary">Создать первую заявку</Button>
                </Link>
              </div>
            ) : "Заявки не найдены"
          }
          sortKey={sortBy ?? undefined}
          sortOrder={sortOrder ?? undefined}
          onSort={(key, order) => { setSortBy(key); setSortOrder(order); setPage(1); }}
          onRowClick={detail.onRowClick}
          onRowDoubleClick={(req) => router.push(`/account/requests/${req.id}`)}
          rowClassName={() => 'hover:bg-surface-hover transition-colors'}
          footer={
            <div className="flex items-center justify-between w-full">
              <span>Показано {requests.length} из {total}</span>
              <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
          }
        />
      ) : loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} className="h-36" />)}
        </div>
      ) : requests.length === 0 ? (
        total === 0 && !search && !statusFilter ? (
          <div className="flex flex-col items-center gap-4 py-12">
            <p className="text-base text-text-sub">У вас пока нет заявок</p>
            <Link href="/account/requests/create">
              <Button variant="primary">Создать первую заявку</Button>
            </Link>
          </div>
        ) : (
          <p className="text-sm text-text-sub">Заявки не найдены</p>
        )
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {requests.map((req) => (
              <RequestCard
                key={req.id}
                request={req}
                onClick={() => detail.onRowClick(req)}
                onDoubleClick={() => router.push(`/account/requests/${req.id}`)}
              />
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} className="justify-center mt-6" />
        </>
      )}
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
