'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Button,
  Card,
  Badge,
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

const STATUS_BADGE_VARIANT: Record<string, BadgeVariant> = {
  [RepairRequestStatus.PENDING]: 'warning',
  [RepairRequestStatus.PAID]: 'warning',
  [RepairRequestStatus.ASSIGNED]: 'info',
  [RepairRequestStatus.ACCEPTED]: 'info',
  [RepairRequestStatus.IN_PROGRESS]: 'info',
  [RepairRequestStatus.AWAITING_COMPLETION]: 'info',
  [RepairRequestStatus.COMPLETED]: 'success',
  [RepairRequestStatus.CANCELLED]: 'neutral',
  [RepairRequestStatus.REFUSED]: 'error',
  [RepairRequestStatus.REFUND_REQUESTED]: 'warning',
  [RepairRequestStatus.REFUNDED]: 'neutral',
};

type StatusFilter = 'all' | 'active' | 'completed' | 'cancelled';

const STATUS_TAB_MAP: Record<string, StatusFilter> = {
  [RepairRequestStatus.PENDING]: 'active',
  [RepairRequestStatus.PAID]: 'active',
  [RepairRequestStatus.ASSIGNED]: 'active',
  [RepairRequestStatus.ACCEPTED]: 'active',
  [RepairRequestStatus.IN_PROGRESS]: 'active',
  [RepairRequestStatus.AWAITING_COMPLETION]: 'active',
  [RepairRequestStatus.COMPLETED]: 'completed',
  [RepairRequestStatus.CANCELLED]: 'cancelled',
  [RepairRequestStatus.REFUSED]: 'cancelled',
  [RepairRequestStatus.REFUND_REQUESTED]: 'cancelled',
  [RepairRequestStatus.REFUNDED]: 'cancelled',
};

const STATUS_FILTER: FilterDefinition = {
  key: 'status',
  label: '',
  type: 'tabs',
  options: [
    { value: 'all', label: 'Все' },
    { value: 'active', label: 'Активные' },
    { value: 'completed', label: 'Завершенные' },
    { value: 'cancelled', label: 'Отмененные' },
  ],
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
  const badgeVariant = STATUS_BADGE_VARIANT[request.status] ?? 'neutral';

  return (
    <Card padding="none" className="p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-text-sub">{formatDate(request.createdAt)}</span>
        <Badge variant={badgeVariant} className="text-xs">{statusLabel}</Badge>
      </div>
      <p className="text-base font-medium text-text-main truncate">{deviceName}</p>
      <p className="text-sm text-text-sub line-clamp-2">{request.description}</p>
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

function RequestTableRow({ request }: { request: RepairRequest }) {
  const deviceName = request.userDevice?.device?.name ?? 'Устройство';
  const statusLabel = STATUS_LABELS[request.status] ?? request.status;
  const badgeVariant = STATUS_BADGE_VARIANT[request.status] ?? 'neutral';

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
          <Badge variant={badgeVariant} className="text-xs">{statusLabel}</Badge>
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
  const [search, setSearch] = useState('');
  const [filterValues, setFilterValues] = useState<FilterValues>({ status: 'all' });

  const statusFilter = filterValues.status as StatusFilter;

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

  const filteredRequests = useMemo(() => {
    let result = requests;

    // Filter by status tab
    if (statusFilter !== 'all') {
      result = result.filter((r) => STATUS_TAB_MAP[r.status] === statusFilter);
    }

    // Filter by search (device name / description)
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((r) => {
        const deviceName = (r.userDevice?.device?.name ?? '').toLowerCase();
        const description = (r.description ?? '').toLowerCase();
        return deviceName.includes(q) || description.includes(q);
      });
    }

    return result;
  }, [requests, statusFilter, search]);

  const handleFilterChange = (key: string, value: string) => {
    setFilterValues((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <PageContainer>
      <PageHeader>Мои заявки</PageHeader>

      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row gap-4 items-stretch">
        <DataSearch value={search} onChange={setSearch} placeholder="Поиск по устройству или описанию" className="lg:w-[320px] flex-shrink-0" />
        <div className="flex-1 flex items-center gap-3">
          <DataFilter
            filters={[STATUS_FILTER]}
            values={filterValues}
            onChange={handleFilterChange}
          />
          <div className="ml-auto flex-shrink-0 flex items-center gap-2">
            <ViewSwitcher views={[VIEW_TABLE, VIEW_CARD]} activeView={view} onViewChange={setView} />
            <Link href="/account/requests/create">
              <Button variant="primary">Создать заявку</Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Data */}
      {loading ? (
        <p className="text-sm text-text-sub">Загрузка...</p>
      ) : filteredRequests.length === 0 ? (
        requests.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-12">
            <p className="text-base text-text-sub">У вас пока нет заявок</p>
            <Link href="/account/requests/create">
              <Button variant="primary">Создать первую заявку</Button>
            </Link>
          </div>
        ) : (
          <p className="text-sm text-text-sub">Заявки не найдены</p>
        )
      ) : view === 'card' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRequests.map((req) => (
            <RequestCard key={req.id} request={req} />
          ))}
        </div>
      ) : (
        <DataTable>
          <DataTableHeader>
            <div className="w-[200px] flex-shrink-0">Устройство</div>
            <div className="flex-1 px-4">Описание</div>
            <div className="w-[160px] px-4">Статус</div>
            <div className="w-[120px] px-4">Дата</div>
          </DataTableHeader>
          {filteredRequests.map((req) => (
            <RequestTableRow key={req.id} request={req} />
          ))}
          <DataTableFooter>
            Показано {filteredRequests.length} из {requests.length}
          </DataTableFooter>
        </DataTable>
      )}
    </PageContainer>
  );
}
