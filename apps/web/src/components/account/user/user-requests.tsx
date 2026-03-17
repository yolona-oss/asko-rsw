'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button, Card } from '@asko/ui';
import { PageContainer } from '@/components/account/page-container';
import { PageHeader } from '@/components/account/page-header';
import { userApi } from '@/lib/api/user';
import { RepairRequestStatus } from '@asko/shared/client';

const STATUS_LABELS: Record<string, string> = {
  [RepairRequestStatus.PENDING]: 'Создана',
  [RepairRequestStatus.PAID]: 'Оплачена',
  [RepairRequestStatus.ASSIGNED]: 'Назначен мастер',
  [RepairRequestStatus.ACCEPTED]: 'Мастер выехал',
  [RepairRequestStatus.IN_PROGRESS]: 'В работе',
  [RepairRequestStatus.AWAITING_COMPLETION]: 'Завершается',
  [RepairRequestStatus.COMPLETED]: 'Завершена',
  [RepairRequestStatus.CANCELLED]: 'Отменена',
  [RepairRequestStatus.REFUSED]: 'Отказ мастера',
  [RepairRequestStatus.REFUND_REQUESTED]: 'Запрос возврата',
  [RepairRequestStatus.REFUNDED]: 'Возврат',
};

const STATUS_COLORS: Record<string, string> = {
  [RepairRequestStatus.PENDING]: 'text-yellow-600',
  [RepairRequestStatus.PAID]: 'text-yellow-600',
  [RepairRequestStatus.ASSIGNED]: 'text-blue-600',
  [RepairRequestStatus.ACCEPTED]: 'text-blue-600',
  [RepairRequestStatus.IN_PROGRESS]: 'text-blue-600',
  [RepairRequestStatus.AWAITING_COMPLETION]: 'text-blue-600',
  [RepairRequestStatus.COMPLETED]: 'text-green-600',
  [RepairRequestStatus.CANCELLED]: 'text-text-sub',
  [RepairRequestStatus.REFUSED]: 'text-brand-red',
  [RepairRequestStatus.REFUND_REQUESTED]: 'text-yellow-600',
  [RepairRequestStatus.REFUNDED]: 'text-text-sub',
};

interface RepairRequest {
  id: string;
  status: RepairRequestStatus;
  description: string;
  createdAt: string;
  updatedAt: string;
  userDevice?: {
    device?: { name?: string };
    serialNumber?: string;
  };
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function RequestCard({ request }: { request: RepairRequest }) {
  const deviceName = request.userDevice?.device?.name ?? 'Устройство';
  const statusLabel = STATUS_LABELS[request.status] ?? request.status;
  const statusColor = STATUS_COLORS[request.status] ?? 'text-text-main';

  return (
    <Link href={`/account/requests/${request.id}`}>
      <Card className="flex flex-col gap-3 hover:shadow-md transition-shadow cursor-pointer">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1 min-w-0">
            <p className="text-base font-medium text-text-main truncate">{deviceName}</p>
            <p className="text-sm text-text-sub line-clamp-2">{request.description}</p>
          </div>
          <span className={`text-sm font-medium flex-shrink-0 ${statusColor}`}>
            {statusLabel}
          </span>
        </div>
        <span className="text-xs text-text-sub">{formatDate(request.createdAt)}</span>
      </Card>
    </Link>
  );
}

export function UserRequests() {
  const [requests, setRequests] = useState<RepairRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRequests() {
      try {
        const { data } = await userApi.getMyRequests({ limit: 50 });
        const list = Array.isArray(data) ? data : data.data ?? [];
        setRequests(list);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchRequests();
  }, []);

  return (
    <PageContainer>
      <div className="flex items-center justify-between gap-4">
        <PageHeader>Мои заявки</PageHeader>
        <Link href="/account/requests/create">
          <Button variant="primary">Создать заявку</Button>
        </Link>
      </div>

      {loading ? (
        <p className="text-sm text-text-sub">Загрузка...</p>
      ) : requests.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-12">
          <p className="text-base text-text-sub">У вас пока нет заявок</p>
          <Link href="/account/requests/create">
            <Button variant="primary">Создать первую заявку</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {requests.map((req) => (
            <RequestCard key={req.id} request={req} />
          ))}
        </div>
      )}
    </PageContainer>
  );
}
