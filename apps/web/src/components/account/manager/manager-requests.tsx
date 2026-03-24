'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, TabList, Tab } from '@asko/ui';
import { PageContainer } from '@/components/account/page-container';
import { PageHeader } from '@/components/account/page-header';
import { managerApi } from '@/lib/api/manager';
import { RepairRequestStatus } from '@asko/shared/client';

type TabKey = 'all' | 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'all', label: 'Все' },
  { key: 'pending', label: 'Новые' },
  { key: 'assigned', label: 'Назначенные' },
  { key: 'in_progress', label: 'В работе' },
  { key: 'completed', label: 'Завершенные' },
  { key: 'cancelled', label: 'Отмененные' },
];

const STATUS_MAP: Record<string, TabKey> = {
  [RepairRequestStatus.PENDING]: 'pending',
  [RepairRequestStatus.PAID]: 'pending',
  [RepairRequestStatus.ASSIGNED]: 'assigned',
  [RepairRequestStatus.ACCEPTED]: 'assigned',
  [RepairRequestStatus.IN_PROGRESS]: 'in_progress',
  [RepairRequestStatus.AWAITING_COMPLETION]: 'in_progress',
  [RepairRequestStatus.COMPLETED]: 'completed',
  [RepairRequestStatus.CANCELLED]: 'cancelled',
  [RepairRequestStatus.REFUSED]: 'cancelled',
  [RepairRequestStatus.REFUND_REQUESTED]: 'cancelled',
  [RepairRequestStatus.REFUNDED]: 'cancelled',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-green-600 text-white',
  assigned: 'bg-yellow-500 text-white',
  in_progress: 'bg-blue-500 text-white',
  completed: 'bg-gray-600 text-white',
  cancelled: 'bg-red-500 text-white',
};

const STATUS_LABELS: Record<string, string> = {
  [RepairRequestStatus.PENDING]: 'Новая',
  [RepairRequestStatus.PAID]: 'Оплачена',
  [RepairRequestStatus.ASSIGNED]: 'Назначена',
  [RepairRequestStatus.ACCEPTED]: 'Принята',
  [RepairRequestStatus.IN_PROGRESS]: 'В работе',
  [RepairRequestStatus.AWAITING_COMPLETION]: 'Ожидает завершения',
  [RepairRequestStatus.COMPLETED]: 'Завершена',
  [RepairRequestStatus.CANCELLED]: 'Отменена',
  [RepairRequestStatus.REFUSED]: 'Отказ',
  [RepairRequestStatus.REFUND_REQUESTED]: 'Запрос возврата',
  [RepairRequestStatus.REFUNDED]: 'Возвращено',
};

interface RepairRequest {
  id: string;
  description: string;
  status: RepairRequestStatus;
  user?: { firstName?: string; lastName?: string };
  address?: { city?: string; street?: string };
  userDevice?: { device?: { name?: string } };
  createdAt: Date | string;
}

function formatDate(dateStr: Date | string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function RequestCardItem({ request }: { request: RepairRequest }) {
  const tabKey = STATUS_MAP[request.status] ?? 'pending';
  const userName = [request.user?.lastName, request.user?.firstName].filter(Boolean).join(' ') || 'Пользователь';
  const deviceName = request.userDevice?.device?.name || request.description;
  const location = request.address?.city || '';

  return (
    <Card padding="none" className="p-5 flex flex-col gap-3">
      <div className="flex items-center gap-2 text-xs text-text-sub">
        <span>{formatDate(request.createdAt)}</span>
        {location && (
          <>
            <span>&bull;</span>
            <span>{location}</span>
          </>
        )}
      </div>
      <p className="text-sm font-medium text-text-main">{userName}</p>
      <p className="text-sm text-text-sub">{deviceName}</p>
      <div className="flex items-center gap-2 mt-1">
        <span className="text-sm font-bold text-text-main">Статус:</span>
        <span
          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[tabKey] ?? 'bg-gray-400 text-white'}`}
        >
          {STATUS_LABELS[request.status] ?? request.status}
        </span>
      </div>
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

export function ManagerRequests() {
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [requests, setRequests] = useState<RepairRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRequests() {
      try {
        const { data } = await managerApi.getRepairRequests({ limit: 100 });
        setRequests((data.data ?? []) as unknown as RepairRequest[]);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchRequests();
  }, []);

  const filteredRequests = activeTab === 'all'
    ? requests
    : requests.filter((r) => STATUS_MAP[r.status] === activeTab);

  return (
    <PageContainer>
      <PageHeader>
        Заявки на обслуживание
      </PageHeader>

      {/* Tabs */}
      <TabList>
        {TABS.map((tab) => (
          <Tab
            key={tab.key}
            active={activeTab === tab.key}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </Tab>
        ))}
      </TabList>

      {/* Request cards grid */}
      {loading ? (
        <p className="text-sm text-text-sub">Загрузка...</p>
      ) : filteredRequests.length === 0 ? (
        <p className="text-sm text-text-sub">Нет заявок</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRequests.map((req) => (
            <RequestCardItem key={req.id} request={req} />
          ))}
        </div>
      )}
    </PageContainer>
  );
}
