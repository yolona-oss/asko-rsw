'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Card,
  Badge,
  Button,
  ViewSwitcher,
  VIEW_TABLE,
  VIEW_CARD,
  DataSearch,
  DataFilter,
  DataTable,
  DataTableHeader,
  DataTableRow,
  DataTableCell,
  DataTableFooter,
} from '@asko/ui';
import type { FilterDefinition, FilterValues } from '@asko/ui';
import { PageContainer } from '@/components/account/page-container';
import { PageHeader } from '@/components/account/page-header';
import { repairRequestApi } from '@/lib/api/repair-request';
import { chatApi } from '@/lib/api/chat';
import { useAuth } from '@/lib/api/use-auth';
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
  [RepairRequestStatus.PAUSED]: 'in_progress',
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
  [RepairRequestStatus.PAUSED]: 'Приостановлена',
  [RepairRequestStatus.AWAITING_COMPLETION]: 'Ожидает завершения',
  [RepairRequestStatus.COMPLETED]: 'Завершена',
  [RepairRequestStatus.CANCELLED]: 'Отменена',
  [RepairRequestStatus.REFUSED]: 'Отказ',
  [RepairRequestStatus.REFUND_REQUESTED]: 'Запрос возврата',
  [RepairRequestStatus.REFUNDED]: 'Возвращено',
};

const PAGE_SIZE = 12;

interface RepairRequest {
  id: string;
  description: string;
  status: RepairRequestStatus;
  conversationId?: string;
  user?: { firstName?: string; lastName?: string };
  address?: { city?: string; street?: string };
  userDevice?: { device?: { name?: string } };
  createdAt: Date | string;
}

interface ConversationInfo {
  unreadCount: number;
  participantUserIds: string[];
}

function formatDate(dateStr: Date | string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function ChatStatusBadges({ convInfo, currentUserId }: { convInfo?: ConversationInfo; currentUserId: string }) {
  if (!convInfo) return null;

  const iAmIn = convInfo.participantUserIds.includes(currentUserId);
  const hasManager = convInfo.participantUserIds.length > 1;

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {convInfo.unreadCount > 0 && (
        <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-brand-red text-white text-[10px] font-bold">
          {convInfo.unreadCount > 99 ? '99+' : convInfo.unreadCount}
        </span>
      )}
      {iAmIn ? (
        <Badge variant="success" className="text-[10px] py-0 px-1.5">подключен</Badge>
      ) : hasManager ? (
        <Badge variant="warning" className="text-[10px] py-0 px-1.5">другой менеджер</Badge>
      ) : (
        <Badge variant="error" className="text-[10px] py-0 px-1.5">ожидает менеджера</Badge>
      )}
    </div>
  );
}

const TAB_FILTER: FilterDefinition = {
  key: 'tab',
  label: '',
  type: 'tabs',
  options: TABS.map((tab) => ({ value: tab.key, label: tab.label })),
};

function RequestCardItem({ request, convInfo, currentUserId }: { request: RepairRequest; convInfo?: ConversationInfo; currentUserId: string }) {
  const tabKey = STATUS_MAP[request.status] ?? 'pending';
  const userName = [request.user?.lastName, request.user?.firstName].filter(Boolean).join(' ') || 'Пользователь';
  const deviceName = request.userDevice?.device?.name || request.description;
  const location = request.address?.city || '';

  return (
    <Card padding="none" className="p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs text-text-sub">
          <span>{formatDate(request.createdAt)}</span>
          {location && (
            <>
              <span>&bull;</span>
              <span>{location}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          {request.conversationId && (
            <ChatStatusBadges convInfo={convInfo} currentUserId={currentUserId} />
          )}
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[tabKey] ?? 'bg-gray-400 text-white'}`}
          >
            {STATUS_LABELS[request.status] ?? request.status}
          </span>
        </div>
      </div>
      <p className="text-sm font-medium text-text-main">{userName}</p>
      <p className="text-sm text-text-sub">{deviceName}</p>
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

function RequestTableRow({ request, convInfo, currentUserId }: { request: RepairRequest; convInfo?: ConversationInfo; currentUserId: string }) {
  const userName = [request.user?.lastName, request.user?.firstName].filter(Boolean).join(' ') || 'Пользователь';
  const deviceName = request.userDevice?.device?.name || request.description;
  const tabKey = STATUS_MAP[request.status] ?? 'pending';

  return (
    <Link href={`/account/requests/${request.id}`} className="contents">
      <DataTableRow className="hover:bg-gray-50 transition-colors cursor-pointer">
        <DataTableCell mobileLabel="Клиент:" className="lg:w-[180px] lg:flex-shrink-0">
          <p className="text-sm font-medium text-text-main">{userName}</p>
        </DataTableCell>
        <DataTableCell mobileLabel="Устройство:" className="lg:flex-1 lg:px-4">
          <p className="text-sm text-text-main truncate">{deviceName}</p>
        </DataTableCell>
        <DataTableCell mobileLabel="Город:" className="lg:w-[120px] lg:px-4">
          <p className="text-sm text-text-main">{request.address?.city ?? '—'}</p>
        </DataTableCell>
        <DataTableCell mobileLabel="Статус:" className="lg:w-[160px] lg:px-4">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[tabKey] ?? 'bg-gray-400 text-white'}`}>
            {STATUS_LABELS[request.status] ?? request.status}
          </span>
        </DataTableCell>
        <DataTableCell mobileLabel="Чат:" className="lg:w-[140px] lg:px-4">
          {request.conversationId && <ChatStatusBadges convInfo={convInfo} currentUserId={currentUserId} />}
        </DataTableCell>
        <DataTableCell mobileLabel="Дата:" className="lg:w-[140px] lg:px-4">
          <p className="text-sm text-text-main">{formatDate(request.createdAt)}</p>
        </DataTableCell>
      </DataTableRow>
    </Link>
  );
}

export function ManagerRequests() {
  const { user: authUser } = useAuth();
  const currentUserId = authUser?.id ?? '';

  const [filterValues, setFilterValues] = useState<FilterValues>({ tab: 'all' });
  const activeTab = filterValues.tab as TabKey;
  const [requests, setRequests] = useState<RepairRequest[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [convInfoMap, setConvInfoMap] = useState<Record<string, ConversationInfo>>({});
  const [view, setView] = useState('card');
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function fetchRequests() {
      setLoading(true);
      try {
        const { data } = await repairRequestApi.getAll({ offset: page, limit: PAGE_SIZE });
        const items = (data.data ?? []) as unknown as RepairRequest[];
        setRequests(items);
        setTotal(data.overallCount ?? 0);

        // Fetch conversation info for requests that have conversations
        const withConv = items.filter(r => r.conversationId);
        if (withConv.length > 0) {
          const infoMap: Record<string, ConversationInfo> = {};
          await Promise.all(withConv.map(async (r) => {
            try {
              const { data: conv } = await chatApi.getConversation(r.conversationId!);
              infoMap[r.id] = {
                unreadCount: conv.conversation.unreadCount ?? 0,
                participantUserIds: conv.conversation.participants.map((p: any) => p.userId),
              };
            } catch {
              // Manager may not be a participant — just check participants list
              try {
                const { data: parts } = await chatApi.listParticipants(r.conversationId!);
                infoMap[r.id] = {
                  unreadCount: 0,
                  participantUserIds: (parts.participants ?? []).map((p: any) => p.userId),
                };
              } catch { }
            }
          }));
          setConvInfoMap(infoMap);
        }
      } catch { } finally {
        setLoading(false);
      }
    }
    fetchRequests();
  }, [page]);

  // Client-side filtering by tab and search
  const filteredRequests = (() => {
    let result = requests;

    if (activeTab !== 'all') {
      result = result.filter((r) => STATUS_MAP[r.status] === activeTab);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((r) => {
        const userName = [r.user?.lastName, r.user?.firstName].filter(Boolean).join(' ').toLowerCase();
        const deviceName = (r.userDevice?.device?.name ?? '').toLowerCase();
        const city = (r.address?.city ?? '').toLowerCase();
        return userName.includes(q) || deviceName.includes(q) || city.includes(q);
      });
    }

    return result;
  })();

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const handleFilterChange = (key: string, value: string) => {
    setFilterValues((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const handleSearch = (value: string) => {
    setSearch(value);
  };

  return (
    <PageContainer>
      <PageHeader>Заявки на обслуживание</PageHeader>

      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row gap-4 items-stretch">
        <DataSearch
          value={search}
          onChange={setSearch}
          placeholder="Поиск"
          className="lg:w-[320px] flex-shrink-0"
        />
        <div className="flex-1 flex items-center gap-3">
          <DataFilter
            filters={[TAB_FILTER]}
            values={filterValues}
            onChange={(key, value) => setFilterValues((prev) => ({ ...prev, [key]: value }))}
          />
          <div className="ml-auto flex-shrink-0 flex items-center gap-3">
            <ViewSwitcher views={[VIEW_TABLE, VIEW_CARD]} activeView={view} onViewChange={setView} />
          </div>
        </div>
      </div>

      {/* Request data */}
      {loading ? (
        <p className="text-sm text-text-sub">Загрузка...</p>
      ) : filteredRequests.length === 0 ? (
        <p className="text-sm text-text-sub">Нет заявок</p>
      ) : view === 'card' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRequests.map((req) => (
            <RequestCardItem
              key={req.id}
              request={req}
              convInfo={convInfoMap[req.id]}
              currentUserId={currentUserId}
            />
          ))}
        </div>
      ) : (
        <DataTable>
          <DataTableHeader>
            <div className="w-[180px] flex-shrink-0">Клиент</div>
            <div className="flex-1 px-4">Устройство</div>
            <div className="w-[120px] px-4">Город</div>
            <div className="w-[160px] px-4">Статус</div>
            <div className="w-[140px] px-4">Чат</div>
            <div className="w-[140px] px-4">Дата</div>
          </DataTableHeader>
          {filteredRequests.map((req) => (
            <RequestTableRow
              key={req.id}
              request={req}
              convInfo={convInfoMap[req.id]}
              currentUserId={currentUserId}
            />
          ))}
          <DataTableFooter>
            Показано {filteredRequests.length} из {total}
          </DataTableFooter>
        </DataTable>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            Назад
          </Button>
          <span className="text-sm text-text-sub">
            {page} / {totalPages}
          </span>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >
            Далее
          </Button>
        </div>
      )}
    </PageContainer>
  );
}
