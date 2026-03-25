'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Button,
  Card,
  ViewSwitcher,
  VIEW_TABLE,
  VIEW_CARD,
  DataTable,
  DataTableHeader,
  DataTableRow,
  DataTableCell,
} from '@asko/ui';
import { PageContainer } from '@/components/account/page-container';
import { PageHeader } from '@/components/account/page-header';
import { repairRequestApi } from '@/lib/api/repair-request';
import { RepairRequestStatus } from '@asko/shared/client';

const STATUS_LABELS: Record<string, string> = {
  [RepairRequestStatus.PENDING]: 'Ожидает оплаты',
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
  createdAt: Date | string;
  updatedAt: Date | string;
  userDevice?: {
    device?: { name?: string };
    serialNumber?: string;
  };
}

function formatDate(dateStr: Date | string) {
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

function RequestTableRow({ request }: { request: RepairRequest }) {
  const deviceName = request.userDevice?.device?.name ?? 'Устройство';
  const statusLabel = STATUS_LABELS[request.status] ?? request.status;
  const statusColor = STATUS_COLORS[request.status] ?? 'text-text-main';

  return (
    <Link href={`/account/requests/${request.id}`} className="contents">
      <DataTableRow className="hover:bg-gray-50 transition-colors cursor-pointer">
        <DataTableCell mobileLabel="Устройство:" className="lg:w-[200px] lg:flex-shrink-0">
          <p className="text-sm font-medium text-text-main">{deviceName}</p>
        </DataTableCell>
        <DataTableCell mobileLabel="Описание:" className="lg:flex-1 lg:px-4">
          <p className="text-sm text-text-main truncate">{request.description}</p>
        </DataTableCell>
        <DataTableCell mobileLabel="Статус:" className="lg:w-[160px] lg:px-4">
          <span className={`text-sm font-medium ${statusColor}`}>{statusLabel}</span>
        </DataTableCell>
        <DataTableCell mobileLabel="Дата:" className="lg:w-[120px] lg:px-4">
          <p className="text-sm text-text-main">{formatDate(request.createdAt)}</p>
        </DataTableCell>
      </DataTableRow>
    </Link>
  );
}

export function UserRequests() {
  const [requests, setRequests] = useState<RepairRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('card');

  useEffect(() => {
    async function fetchRequests() {
      try {
        const { data } = await repairRequestApi.getMy({ limit: 50 });
        setRequests((data.data ?? []) as unknown as RepairRequest[]);
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
      <PageHeader>Мои заявки</PageHeader>

      <div className="flex items-center justify-between gap-4">
        <ViewSwitcher
          views={[VIEW_CARD, VIEW_TABLE]}
          activeView={view}
          onViewChange={setView}
        />
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
      ) : view === 'card' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {requests.map((req) => (
            <RequestCard key={req.id} request={req} />
          ))}
        </div>
      ) : (
        <>
          <DataTableHeader>
            <div className="w-[200px] flex-shrink-0">Устройство</div>
            <div className="flex-1 px-4">Описание</div>
            <div className="w-[160px] px-4">Статус</div>
            <div className="w-[120px] px-4">Дата</div>
          </DataTableHeader>
          <DataTable>
            {requests.map((req) => (
              <RequestTableRow key={req.id} request={req} />
            ))}
          </DataTable>
        </>
      )}
    </PageContainer>
  );
}
