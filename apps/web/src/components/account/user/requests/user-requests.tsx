'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  Button,
  ViewSwitcher,
  VIEW_TABLE,
  VIEW_CARD,
  DataSearch,
  DataFilter,
  DataTable,
  DataTableHeader,
  DataTableFooter,
  Pagination,
} from '@asko/ui';
import type { FilterValues } from '@asko/ui';
import { PageContainer } from '@/components/account/page-container';
import { PageHeader } from '@/components/account/page-header';
import { repairRequestApi } from '@/lib/api/repair-request';
import { AddDeviceForm } from '@/components/account/user/certificates/add-device-form';
import { AddCertificateForm } from '@/components/account/user/certificates/add-certificate-form';
import { STATUS_TAB_MAP, STATUS_FILTER, type StatusFilter } from './constants';
import type { RepairRequest } from './types';
import { RequestCard } from './request-card';
import { RequestTableRow } from './request-table-row';

const PAGE_SIZE = 20;

export function UserRequests() {
  const [requests, setRequests] = useState<RepairRequest[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('card');
  const [search, setSearch] = useState('');
  const [filterValues, setFilterValues] = useState<FilterValues>({ status: 'all' });
  const [showAddDevice, setShowAddDevice] = useState(false);
  const [showAddCert, setShowAddCert] = useState(false);

  const statusFilter = filterValues.status as StatusFilter;

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await repairRequestApi.getMy({ offset: page, limit: PAGE_SIZE });
      setRequests((data.data ?? []) as unknown as RepairRequest[]);
      setTotal(data.overallCount ?? 0);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

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

  // Reset page on search/filter changes
  useEffect(() => { setPage(1); }, [search, statusFilter]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const handleFilterChange = (key: string, value: string) => {
    setFilterValues((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <PageContainer>
      <PageHeader>Мои заявки</PageHeader>

      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row gap-4 items-stretch">
        <div className="flex-shrink-0">
          <DataSearch
            value={search}
            onChange={setSearch}
            placeholder="Поиск по устройству или описанию"
            className="lg:w-[320px]"
          />
        </div>
        <div className="flex-1 flex items-center gap-3">
          <DataFilter
            filters={[STATUS_FILTER]}
            values={filterValues}
            onChange={handleFilterChange}
          />
          <div className="ml-auto flex-shrink-0 flex items-center gap-2">
            <ViewSwitcher views={[VIEW_TABLE, VIEW_CARD]} activeView={view} onViewChange={setView} />
            <Button variant="secondary" size="sm" onClick={() => setShowAddDevice(true)}>Добавить устройство</Button>
            <Button variant="secondary" size="sm" onClick={() => setShowAddCert(true)}>Добавить сертификат</Button>
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
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRequests.map((req) => (
              <RequestCard key={req.id} request={req} />
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} className="justify-center mt-6" />
        </>
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
            <div className="flex items-center justify-between w-full">
              <span>Показано {filteredRequests.length} из {total}</span>
              <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
          </DataTableFooter>
        </DataTable>
      )}
      <AddDeviceForm
        open={showAddDevice}
        onClose={() => setShowAddDevice(false)}
        onSuccess={() => setShowAddDevice(false)}
      />

      <AddCertificateForm
        open={showAddCert}
        onClose={() => setShowAddCert(false)}
        onSuccess={() => setShowAddCert(false)}
        onOpenAddDevice={() => setShowAddDevice(true)}
      />
    </PageContainer>
  );
}
