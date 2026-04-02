'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  DataTable,
  DataTableHeader,
  DataTableEmpty,
  DataTableFooter,
  DataToolbar,
  VIEW_TABLE,
  VIEW_CARD,
  Pagination,
} from '@asko/ui';
import type { FilterValues } from '@asko/ui';
import { PageContainer } from '@/components/account/page-container';
import { PageHeader } from '@/components/account/page-header';
import { certificateApi } from '@/lib/api/certificate';
import type { ICertificate } from '@/lib/api/types';
import { STATUS_FILTER } from './constants';
import { CertificateRow } from './certificate-row';
import { CertificateCard } from './certificate-card';

const PAGE_SIZE = 20;

export function AdminCertificates() {
  const [filterValues, setFilterValues] = useState<FilterValues>({ status: 'active' });
  const [certificates, setCertificates] = useState<ICertificate[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('table');
  const [search, setSearch] = useState('');

  const fetchCertificates = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await certificateApi.getAll({ offset: page, limit: PAGE_SIZE });
      setCertificates(data.data ?? []);
      setTotal(data.overallCount ?? 0);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchCertificates();
  }, [fetchCertificates]);

  const handleRevoke = async (id: string) => {
    try {
      await certificateApi.revoke(id);
      await fetchCertificates();
    } catch {
    }
  };

  const filteredCerts = useMemo(() => {
    let result = certificates.filter((c) => c.status === filterValues.status);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((c) => {
        const userName = [c.user?.lastName, c.user?.firstName].filter(Boolean).join(' ').toLowerCase();
        const deviceName = (c.userDevice?.device?.name ?? '').toLowerCase();
        const dealerName = (c.dealer?.companyName ?? '').toLowerCase();
        const certNum = c.certificateNumber.toLowerCase();
        return userName.includes(q) || deviceName.includes(q) || dealerName.includes(q) || certNum.includes(q);
      });
    }
    return result;
  }, [certificates, filterValues.status, search]);

  // Reset page on search/filter changes
  useEffect(() => { setPage(1); }, [search, filterValues.status]);

  const totalPages = Math.ceil(filteredCerts.length / PAGE_SIZE);
  const paginatedCerts = filteredCerts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalInStatus = certificates.filter((c) => c.status === filterValues.status).length;

  return (
    <PageContainer>
      <PageHeader>Управление сертификатами</PageHeader>

      {/* Toolbar */}
      <DataToolbar
        search={{ value: search, onChange: setSearch, placeholder: "Поиск" }}
        filters={[STATUS_FILTER]}
        filterValues={filterValues}
        onFilterChange={(key, value) => setFilterValues((prev) => ({ ...prev, [key]: value }))}
        views={[VIEW_TABLE, VIEW_CARD]}
        activeView={view}
        onViewChange={setView}
      />

      {loading ? (
        <p className="text-sm text-text-sub p-4">Загрузка...</p>
      ) : view === 'table' ? (
        <DataTable>
          <DataTableHeader>
            <div className="w-[140px] flex-shrink-0">Номер</div>
            <div className="flex-1 px-4">Пользователь</div>
            <div className="flex-1 px-4">Устройство</div>
            <div className="w-[150px] px-4">Дилер</div>
            <div className="w-[130px] px-4">Статус</div>
            <div className="w-[100px] px-4">Выдан</div>
            <div className="w-[100px] px-4">Истекает</div>
            <div className="w-[120px] flex-shrink-0" />
          </DataTableHeader>

          {filteredCerts.length === 0 ? (
            <DataTableEmpty>
              Нет сертификатов в этой категории
            </DataTableEmpty>
          ) : (
            paginatedCerts.map((cert) => (
              <CertificateRow
                key={cert.id}
                cert={cert}
                onRevoke={handleRevoke}
              />
            ))
          )}

          <DataTableFooter>
            <div className="flex items-center justify-between w-full">
              <span>Показано {paginatedCerts.length} из {filteredCerts.length}</span>
              <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
          </DataTableFooter>
        </DataTable>
      ) : (
        <>
          {filteredCerts.length === 0 ? (
            <p className="text-sm text-text-sub text-center py-8">Нет сертификатов в этой категории</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginatedCerts.map((cert) => (
                <CertificateCard
                  key={cert.id}
                  cert={cert}
                  onRevoke={handleRevoke}
                />
              ))}
            </div>
          )}
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} className="justify-center mt-6" />
        </>
      )}
    </PageContainer>
  );
}
