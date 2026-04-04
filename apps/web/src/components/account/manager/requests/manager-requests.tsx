'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  DataToolbar,
  VIEW_TABLE,
  VIEW_CARD,
  DataGrid,
  Pagination,
} from '@asko/ui';
import type { FilterValues, DataGridColumn, SortOrder } from '@asko/ui';
import { PageContainer } from '@/components/account/page-container';
import { PageHeader } from '@/components/account/page-header';
import { repairRequestApi } from '@/lib/api/repair-request';
import { chatApi } from '@/lib/api/chat';
import { useAuth } from '@/lib/api/use-auth';
import type { TabKey, RepairRequest, ConversationInfo } from './types';
import { PAGE_SIZE, TAB_FILTER, STATUS_MAP, STATUS_COLORS, STATUS_LABELS, formatDate } from './constants';
import { RequestCardItem } from './request-card-item';
import { ChatStatusBadges } from './chat-status-badges';

export function ManagerRequests() {
  const router = useRouter();
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
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder | null>(null);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await repairRequestApi.getAll({
        page: page,
        limit: PAGE_SIZE,
        search: search || undefined,
        status: activeTab !== 'all' ? activeTab : undefined,
        sortBy: sortBy ?? undefined,
        sortOrder: sortOrder ?? undefined,
      });
      const items = (data.data ?? []) as unknown as RepairRequest[];
      setRequests(items);
      setTotal(data.overallCount ?? 0);

      // Fetch conversation info for requests that have conversations
      const withConv = items.filter(r => r.conversationId);
      if (withConv.length > 0) {
        const infoMap: Record<string, ConversationInfo> = {};
        await Promise.all(withConv.map(async (r) => {
          try {
            const { data: conv } = await chatApi.getConversation(r.conversationId!, true);
            infoMap[r.id] = {
              unreadCount: conv.conversation.unreadCount ?? 0,
              participantUserIds: conv.conversation.participants.map((p: any) => p.userId),
            };
          } catch {
            // Manager may not be a participant - just check participants list
            try {
              const { data: parts } = await chatApi.listParticipants(r.conversationId!, true);
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
  }, [page, search, activeTab, sortBy, sortOrder]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const requestColumns: DataGridColumn<RepairRequest>[] = useMemo(() => [
    {
      key: 'client',
      header: 'Клиент',
      width: 180,
      mobileLabel: 'Клиент:',
      render: (req) => {
        const userName = [req.user?.lastName, req.user?.firstName].filter(Boolean).join(' ') || 'Пользователь';
        return <p className="text-sm font-medium text-text-main">{userName}</p>;
      },
    },
    {
      key: 'device',
      header: 'Устройство',
      mobileLabel: 'Устройство:',
      render: (req) => {
        const deviceName = req.userDevice?.device?.name || req.description;
        return <p className="text-sm text-text-main truncate">{deviceName}</p>;
      },
    },
    {
      key: 'city',
      header: 'Город',
      width: 120,
      mobileLabel: 'Город:',
      render: (req) => <p className="text-sm text-text-main">{req.address?.city ?? '-'}</p>,
    },
    {
      key: 'status',
      header: 'Статус',
      width: 160,
      mobileLabel: 'Статус:',
      render: (req) => {
        const tabKey = STATUS_MAP[req.status] ?? 'pending';
        return (
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[tabKey] ?? 'bg-gray-400 text-white'}`}>
            {STATUS_LABELS[req.status] ?? req.status}
          </span>
        );
      },
    },
    {
      key: 'chat',
      header: 'Чат',
      width: 140,
      mobileLabel: 'Чат:',
      render: (req) => req.conversationId ? <ChatStatusBadges convInfo={convInfoMap[req.id]} currentUserId={currentUserId} /> : null,
    },
    {
      key: 'date',
      header: 'Дата',
      width: 140,
      mobileLabel: 'Дата:',
      render: (req) => <p className="text-sm text-text-main">{formatDate(req.createdAt)}</p>,
    },
  ], [convInfoMap, currentUserId]);

  return (
    <PageContainer>
      <PageHeader>Заявки на обслуживание</PageHeader>

      {/* Toolbar */}
      <DataToolbar
        search={{ value: search, onChange: (v) => { setSearch(v); setPage(1); }, placeholder: "Поиск" }}
        filters={[TAB_FILTER]}
        filterValues={filterValues}
        onFilterChange={(key, value) => { setFilterValues((prev) => ({ ...prev, [key]: value })); setPage(1); }}
        views={[VIEW_TABLE, VIEW_CARD]}
        activeView={view}
        onViewChange={setView}
      />

      {/* Request data */}
      {
        loading ? (
          <p className="text-sm text-text-sub">Загрузка...</p>
        ) : requests.length === 0 ? (
          <p className="text-sm text-text-sub">Нет заявок</p>
        ) : view === 'card' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {requests.map((req) => (
              <RequestCardItem
                key={req.id}
                request={req}
                convInfo={convInfoMap[req.id]}
                currentUserId={currentUserId}
              />
            ))}
          </div>
        ) : (
          <DataGrid<RepairRequest>
            columns={requestColumns}
            data={requests}
            keyExtractor={(req) => req.id}
            emptyContent="Нет заявок"
            sortKey={sortBy ?? undefined}
            sortOrder={sortOrder ?? undefined}
            onSort={(key, order) => { setSortBy(key); setSortOrder(order); setPage(1); }}
            onRowClick={(req) => router.push(`/account/requests/${req.id}`)}
            footer={
              <div className="flex items-center justify-between w-full">
                <span>Показано {requests.length} из {total}</span>
                <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
              </div>
            }
          />
        )
      }

      {/* Pagination */}
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} className="justify-center mt-6" />
    </PageContainer >
  );
}
