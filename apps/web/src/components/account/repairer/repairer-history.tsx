'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAccount } from '@/components/account/account-provider';
import { repairRequestApi } from '@/lib/api/repair-request';
import { reviewApi } from '@/lib/api/review';
import {
  Card,
  Badge,
  Button,
  DataTable,
  DataTableHeader,
  DataTableRow,
  DataTableCell,
  DataTableEmpty,
  DataTableFooter,
  DataSearch,
  ViewSwitcher,
  VIEW_TABLE,
  VIEW_CARD,
} from '@asko/ui';
import type { BadgeVariant } from '@asko/ui';
import { PageContainer } from '@/components/account/page-container';
import { PageHeader } from '@/components/account/page-header';
import { SkeletonCard } from '@/components/account/skeleton';
import { RepairRequestStatus } from '@asko/shared/client';

const STATUS_LABEL: Partial<Record<RepairRequestStatus, string>> = {
  [RepairRequestStatus.COMPLETED]: 'Выполнено',
  [RepairRequestStatus.REFUSED]: 'Отклонено',
  [RepairRequestStatus.CANCELLED]: 'Отменено',
  [RepairRequestStatus.IN_PROGRESS]: 'В работе',
  [RepairRequestStatus.ASSIGNED]: 'Назначена',
  [RepairRequestStatus.ACCEPTED]: 'Принята',
};

const STATUS_BADGE: Partial<Record<RepairRequestStatus, BadgeVariant>> = {
  [RepairRequestStatus.COMPLETED]: 'success',
  [RepairRequestStatus.REFUSED]: 'error',
  [RepairRequestStatus.CANCELLED]: 'neutral',
  [RepairRequestStatus.IN_PROGRESS]: 'warning',
  [RepairRequestStatus.ASSIGNED]: 'info',
  [RepairRequestStatus.ACCEPTED]: 'info',
};

function formatDateShort(dateStr: Date | string) {
  return new Date(dateStr).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatDateLong(dateStr: Date | string) {
  return new Date(dateStr).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

const LIMIT = 10;

export function RepairerHistory() {
  const { user } = useAccount();

  const [requests, setRequests] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(1);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState<{ average: number; count: number } | null>(null);
  const [view, setView] = useState('card');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!user) return;
    reviewApi.getRating(user.id)
      .then(({ data }) => setRating(data))
      .catch(() => { });
  }, [user]);

  useEffect(() => {
    setLoading(true);
    repairRequestApi.getAssigned({ offset, limit: LIMIT })
      .then(({ data }) => {
        setRequests(data?.data ?? []);
        setTotal(data?.overallCount ?? 0);
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, [offset]);

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
            <svg
              key={i}
              className={`w-6 h-6 ${i < starCount ? 'text-amber-400' : 'text-[#E5E5E5]'}`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
        </div>
      </Card>

      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row gap-4 items-stretch">
        <DataSearch value={search} onChange={setSearch} placeholder="Поиск" className="lg:w-[320px] flex-shrink-0" />
        <div className="flex-1 flex items-center gap-3">
          <div className="ml-auto flex-shrink-0 flex items-center gap-2">
            <ViewSwitcher views={[VIEW_TABLE, VIEW_CARD]} activeView={view} onViewChange={setView} />
          </div>
        </div>
      </div>

      {/* Request list */}
      {loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonCard key={i} className="h-20" />
          ))}
        </div>
      ) : view === 'table' ? (
        <DataTable>
          <DataTableHeader>
            <div className="flex-1">Устройство</div>
            <div className="flex-1 px-4">Описание</div>
            <div className="w-[140px] px-4">Статус</div>
            <div className="w-[140px] px-4">Дата</div>
          </DataTableHeader>

          {filteredRequests.length === 0 ? (
            <DataTableEmpty>История заявок пуста</DataTableEmpty>
          ) : (
            filteredRequests.map((req) => {
              const status = req.status as RepairRequestStatus;
              return (
                <DataTableRow key={req.id}>
                  <DataTableCell mobileLabel="Устройство:" className="lg:flex-1">
                    <p className="text-sm font-medium text-text-main truncate">
                      {req.device?.name ?? req.userDeviceId}
                    </p>
                  </DataTableCell>
                  <DataTableCell mobileLabel="Описание:" className="lg:flex-1 lg:px-4">
                    <p className="text-sm text-text-main line-clamp-1">{req.description}</p>
                  </DataTableCell>
                  <DataTableCell mobileLabel="Статус:" className="lg:w-[140px] lg:px-4">
                    <Badge variant={STATUS_BADGE[status] ?? 'neutral'}>
                      {STATUS_LABEL[status] ?? status}
                    </Badge>
                  </DataTableCell>
                  <DataTableCell mobileLabel="Дата:" className="lg:w-[140px] lg:px-4">
                    <p className="text-sm text-text-sub">{formatDateShort(req.updatedAt)}</p>
                  </DataTableCell>
                </DataTableRow>
              );
            })
          )}

          <DataTableFooter>
            Показано {filteredRequests.length} из {total}
          </DataTableFooter>
        </DataTable>
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
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="secondary"
            disabled={offset <= 1}
            onClick={() => setOffset((p) => p - 1)}
          >
            Назад
          </Button>
          <span className="text-sm text-text-sub">{offset} / {totalPages}</span>
          <Button
            variant="secondary"
            disabled={offset >= totalPages}
            onClick={() => setOffset((p) => p + 1)}
          >
            Вперёд
          </Button>
        </div>
      )}
    </PageContainer>
  );
}
