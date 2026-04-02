'use client';

import { useState, useEffect } from 'react';
import {
  DataToolbar,
  VIEW_TABLE,
  VIEW_CARD,
  DataTable,
  DataTableHeader,
  DataTableFooter,
  Pagination,
} from '@asko/ui';
import type { FilterValues } from '@asko/ui';
import { PageContainer } from '@/components/account/page-container';
import { PageHeader } from '@/components/account/page-header';
import { repairRequestApi } from '@/lib/api/repair-request';
import { chatApi } from '@/lib/api/chat';
import { useAuth } from '@/lib/api/use-auth';
import type { TabKey, RepairRequest, ConversationInfo } from './types';
import { STATUS_MAP, PAGE_SIZE, TAB_FILTER } from './constants';
import { RequestCardItem } from './request-card-item';
import { RequestTableRow } from './request-table-row';

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

  return (
    <PageContainer>
      <PageHeader>Заявки на обслуживание</PageHeader>

      {/* Toolbar */}
      <DataToolbar
        search={{ value: search, onChange: setSearch, placeholder: "Поиск" }}
        filters={[TAB_FILTER]}
        filterValues={filterValues}
        onFilterChange={(key, value) => setFilterValues((prev) => ({ ...prev, [key]: value }))}
        views={[VIEW_TABLE, VIEW_CARD]}
        activeView={view}
        onViewChange={setView}
      />

      {/* Request data */}
      {
        loading ? (
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
              <div className="flex items-center justify-between w-full">
                <span>Показано {filteredRequests.length} из {total}</span>
                <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
              </div>
            </DataTableFooter>
          </DataTable>
        )
      }

      {/* Pagination */}
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} className="justify-center mt-6" />
    </PageContainer >
  );
}
