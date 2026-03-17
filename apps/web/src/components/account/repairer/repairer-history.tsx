'use client';

import { useEffect, useState } from 'react';
import { useAccount } from '@/components/account/account-provider';
import { repairerApi } from '@/lib/api/repairer';
import { Card, Badge, Button } from '@asko/ui';
import { PageContainer } from '@/components/account/page-container';
import { PageHeader } from '@/components/account/page-header';
import { SkeletonCard } from '@/components/account/skeleton';
import type { BadgeVariant } from '@asko/ui';
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

const LIMIT = 10;

export function RepairerHistory() {
  const { user } = useAccount();

  const [requests, setRequests] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState<{ average: number; count: number } | null>(null);

  useEffect(() => {
    if (!user) return;
    repairerApi.getRepairerRating(user.id)
      .then(({ data }) => setRating(data))
      .catch(() => { });
  }, [user]);

  useEffect(() => {
    setLoading(true);
    repairerApi.getAssignedRequests({ page, limit: LIMIT })
      .then(({ data }) => {
        setRequests(data?.items ?? []);
        setTotal(data?.total ?? 0);
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, [page]);

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

      {/* Request list */}
      {loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonCard key={i} className="h-20" />
          ))}
        </div>
      ) : requests.length === 0 ? (
        <Card className="text-text-sub text-sm">История заявок пуста</Card>
      ) : (
        <div className="flex flex-col gap-3">
          {requests.map((req) => {
            const status = req.status as RepairRequestStatus;
            return (
              <Card key={req.id} className="flex flex-col gap-2">
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
                  {new Date(req.updatedAt).toLocaleDateString('ru-RU', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="secondary"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Назад
          </Button>
          <span className="text-sm text-text-sub">{page} / {totalPages}</span>
          <Button
            variant="secondary"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Вперёд
          </Button>
        </div>
      )}
    </PageContainer>
  );
}
