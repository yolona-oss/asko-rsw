'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Card,
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
import { RepairRequestStatus } from '@asko/shared/client';
import { TAB_FILTER, PAGE_SIZE } from './constants';
import type { TabKey } from './constants';
import type { RepairRequest } from './types';
import { RequestCard } from './request-card';
import { RequestTableRow } from './request-table-row';

export function RepairerRequests() {
  const [filterValues, setFilterValues] = useState<FilterValues>({ tab: 'active' });
  const activeTab = filterValues.tab as TabKey;
  const [activeRequest, setActiveRequest] = useState<RepairRequest | null>(null);
  const [requests, setRequests] = useState<RepairRequest[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('card');
  const [search, setSearch] = useState('');

  // Fetch active request once
  useEffect(() => {
    repairRequestApi.getActive()
      .then(({ data }) => {
        const req = (data as any)?.request ?? data;
        if (req?.id) setActiveRequest(req as unknown as RepairRequest);
      })
      .catch(() => {});
  }, []);

  // Fetch list based on tab
  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: page,
        limit: PAGE_SIZE,
        search: search || undefined,
      };

      let result;
      if (activeTab === 'paused') {
        result = await repairRequestApi.getPaused(params);
      } else if (activeTab === 'completed') {
        result = await repairRequestApi.getAssigned({ ...params, status: RepairRequestStatus.COMPLETED });
      } else {
        result = await repairRequestApi.getAssigned(params);
      }

      setRequests((result.data.data ?? []) as unknown as RepairRequest[]);
      setTotal(result.data.overallCount ?? 0);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [page, activeTab, search]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const showActiveHighlight = activeTab === 'active' || activeTab === 'all';

  const handleFilterChange = (key: string, value: string) => {
    setFilterValues((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <PageContainer>
      <PageHeader>Мои заявки</PageHeader>

      {/* Toolbar */}
      <DataToolbar
        search={{ value: search, onChange: handleSearchChange, placeholder: "Поиск по клиенту, устройству или городу" }}
        filters={[TAB_FILTER]}
        filterValues={filterValues}
        onFilterChange={handleFilterChange}
        views={[VIEW_TABLE, VIEW_CARD]}
        activeView={view}
        onViewChange={setView}
      />

      {/* Active request highlight */}
      {activeTab === 'active' && activeRequest && (
        <div className="mb-2">
          <p className="text-sm font-bold text-text-main mb-2">Текущая активная заявка</p>
          {view === 'card' ? (
            <RequestCard request={activeRequest} highlight />
          ) : (
            <DataTable>
              <DataTableHeader>
                <div className="w-[180px] flex-shrink-0">Клиент</div>
                <div className="flex-1 px-4">Устройство</div>
                <div className="w-[120px] px-4">Город</div>
                <div className="w-[160px] px-4">Статус</div>
                <div className="w-[100px] px-4">Стоимость</div>
                <div className="w-[140px] px-4">Дата</div>
                <div className="w-[120px] flex-shrink-0" />
              </DataTableHeader>
              <RequestTableRow request={activeRequest} highlight />
            </DataTable>
          )}
        </div>
      )}

      {activeTab === 'active' && !activeRequest && !loading && (
        <Card className="text-text-sub text-sm">Нет активных заявок</Card>
      )}

      {/* List */}
      {activeTab !== 'active' && (
        <>
          {loading ? (
            <p className="text-sm text-text-sub">Загрузка...</p>
          ) : requests.length === 0 ? (
            <p className="text-sm text-text-sub">Нет заявок</p>
          ) : view === 'card' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {requests.map((req) => (
                <RequestCard
                  key={req.id}
                  request={req}
                  highlight={showActiveHighlight && activeRequest?.id === req.id}
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
                <div className="w-[100px] px-4">Стоимость</div>
                <div className="w-[140px] px-4">Дата</div>
                <div className="w-[120px] flex-shrink-0" />
              </DataTableHeader>
              {requests.map((req) => (
                <RequestTableRow
                  key={req.id}
                  request={req}
                  highlight={showActiveHighlight && activeRequest?.id === req.id}
                />
              ))}
              <DataTableFooter>
                <div className="flex items-center justify-between w-full">
                  <span>Показано {requests.length} из {total}</span>
                  <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
                </div>
              </DataTableFooter>
            </DataTable>
          )}

          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} className="justify-center mt-6" />
        </>
      )}
    </PageContainer>
  );
}
