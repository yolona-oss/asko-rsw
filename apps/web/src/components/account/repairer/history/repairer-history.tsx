'use client';

import { useEffect, useState, useMemo } from 'react';
import { Star } from 'lucide-react';
import { useAccount } from '@/components/account/account-provider';
import { useEntityDetail } from '@/hooks/use-entity-detail';
import { EntityDetailModal } from '@/components/account/shared/entity-detail-modal';
import { RepairRequestDetail, fetchRepairRequestOne } from '@/components/account/shared/repair-request-detail';
import { repairRequestApi } from '@/lib/api/repair-request';
import { reviewApi } from '@/lib/api/review';
import {
  Card,
  Badge,
  DataGrid,
  DataSearch,
  ViewSwitcher,
  VIEW_TABLE,
  VIEW_CARD,
  Pagination,
} from '@asko/ui';
import type { DataGridColumn, SortOrder } from '@asko/ui';
import { PageContainer } from '@/components/account/page-container';
import { PageHeader } from '@/components/account/page-header';
import { RepairRequestStatus } from '@asko/shared/client';
import { STATUS_LABEL, STATUS_BADGE, formatDateShort, formatDateLong, LIMIT } from './constants';

const columns: DataGridColumn<any>[] = [
  {
    key: 'device',
    header: 'Устройство',
    mobileLabel: 'Устройство:',
    render: (req) => (
      <p className="text-sm font-medium text-text-main truncate">
        {req.device?.name ?? req.userDeviceId}
      </p>
    ),
  },
  {
    key: 'description',
    header: 'Описание',
    mobileLabel: 'Описание:',
    render: (req) => (
      <p className="text-sm text-text-main line-clamp-1">{req.description}</p>
    ),
  },
  {
    key: 'status',
    header: 'Статус',
    width: 140,
    mobileLabel: 'Статус:',
    render: (req) => {
      const status = req.status as RepairRequestStatus;
      return (
        <Badge variant={STATUS_BADGE[status] ?? 'neutral'}>
          {STATUS_LABEL[status] ?? status}
        </Badge>
      );
    },
  },
  {
    key: 'date',
    header: 'Дата',
    width: 140,
    mobileLabel: 'Дата:',
    render: (req) => (
      <p className="text-sm text-text-sub">{formatDateShort(req.updatedAt)}</p>
    ),
  },
];

export function RepairerHistory() {
  const { user } = useAccount();
  const detail = useEntityDetail<any>();

  const [requests, setRequests] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState<{ average: number; count: number } | null>(null);
  const [view, setView] = useState('card');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder | null>(null);

  useEffect(() => {
    if (!user) return;
    reviewApi.getRating(user.id)
      .then(({ data }) => setRating(data))
      .catch(() => { });
  }, [user]);

  useEffect(() => {
    setLoading(true);
    repairRequestApi.getAssigned({ page, limit: LIMIT, sortBy: sortBy ?? undefined, sortOrder: sortOrder ?? undefined })
      .then(({ data }) => {
        setRequests(data?.data ?? []);
        setTotal(data?.overallCount ?? 0);
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, [page, sortBy, sortOrder]);

  const filteredRequests = useMemo(() => {
    if (!search) return requests;
    const q = search.toLowerCase();
    return requests.filter((req) => {
      const deviceName = (req.device?.name ?? req.userDeviceId ?? '').toLowerCase();
      const desc = (req.description ?? '').toLowerCase();
      const status = (STATUS_LABEL[req.status as RepairRequestStatus] ?? req.status ?? '').toLowerCase();
      return deviceName.includes(q) || desc.includes(q) || status.includes(q);
    });
  }, [requests, search]);

  const totalPages = Math.ceil(total / LIMIT);
  const starCount = Math.round(rating?.average ?? 0);

  return (
    <PageContainer>
      <PageHeader>История заявок</PageHeader>

      {/* Rating */}
      <Card className="flex items-center gap-6">
        <div className="flex flex-col gap-1">
          <span className="text-sm text-text-sub">Мой рейтинг</span>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-text-main">
              {rating ? rating.average.toFixed(1) : '-'}
            </span>
            <span className="text-text-sub text-sm">/ 5.0</span>
          </div>
          {rating && (
            <span className="text-xs text-text-sub">{rating.count} отзывов</span>
          )}
        </div>
        <div className="flex gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`w-6 h-6 ${i < starCount ? 'text-amber-400 fill-amber-400' : 'text-[#E5E5E5]'}`}
            />
          ))}
        </div>
      </Card>

      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row gap-4 items-stretch">
        <DataSearch value={search} onChange={setSearch} placeholder="Поиск" className="lg:w-[320px] flex-shrink-0" />
      </div>

      {/* ViewSwitcher — above data view */}
      <ViewSwitcher views={[VIEW_TABLE, VIEW_CARD]} activeView={view} onViewChange={setView} />

      {/* Request list */}
      {view === 'table' ? (
        <DataGrid
          loading={loading}
          columns={columns}
          data={filteredRequests}
          keyExtractor={(req) => req.id}
          emptyContent="История заявок пуста"
          sortKey={sortBy ?? undefined}
          sortOrder={sortOrder ?? undefined}
          onSort={(key, order) => { setSortBy(key); setSortOrder(order); setPage(1); }}
          onRowClick={detail.onRowClick}
          footer={
            <div className="flex items-center justify-between w-full">
              <span>Показано {filteredRequests.length} из {total}</span>
              <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
          }
        />
      ) : loading ? (
        <p className="text-sm text-text-sub p-4">Загрузка...</p>
      ) : (
        <>
          {filteredRequests.length === 0 ? (
            <Card className="text-text-sub text-sm">История заявок пуста</Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredRequests.map((req) => {
                const status = req.status as RepairRequestStatus;
                return (
                  <Card key={req.id} padding="none" className="p-5 flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-col gap-1 min-w-0">
                        <p className="text-sm font-medium text-text-main truncate">
                          {req.device?.name ?? req.userDeviceId}
                        </p>
                        <p className="text-xs text-text-sub line-clamp-2">{req.description}</p>
                      </div>
                      <Badge variant={STATUS_BADGE[status] ?? 'neutral'} className="flex-shrink-0">
                        {STATUS_LABEL[status] ?? status}
                      </Badge>
                    </div>
                    <p className="text-xs text-text-sub">
                      {formatDateLong(req.updatedAt)}
                    </p>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Pagination */}
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} className="justify-center mt-6" />

      <EntityDetailModal
        open={detail.open}
        onClose={detail.onClose}
        item={detail.selectedItem}
        title="Детали заявки"
        fetchOne={fetchRepairRequestOne}
        renderContent={(item, loading) => <RepairRequestDetail item={item} loading={loading} />}
      />
    </PageContainer>
  );
}
