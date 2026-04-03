'use client';

import { useState, useEffect, useCallback } from 'react';
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
      const { data } = await certificateApi.getAll({
        page: page,
        limit: PAGE_SIZE,
        search: search || undefined,
        status: filterValues.status as string,
      });
      setCertificates(data.data ?? []);
      setTotal(data.overallCount ?? 0);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [page, search, filterValues.status]);

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

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <PageContainer>
      <PageHeader>Управление сертификатами</PageHeader>

      {/* Toolbar */}
      <DataToolbar
        search={{ value: search, onChange: (v) => { setSearch(v); setPage(1); }, placeholder: "Поиск" }}
        filters={[STATUS_FILTER]}
        filterValues={filterValues}
        onFilterChange={(key, value) => { setFilterValues((prev) => ({ ...prev, [key]: value })); setPage(1); }}
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

          {certificates.length === 0 ? (
            <DataTableEmpty>
              Нет сертификатов в этой категории
            </DataTableEmpty>
          ) : (
            certificates.map((cert) => (
              <CertificateRow
                key={cert.id}
                cert={cert}
                onRevoke={handleRevoke}
              />
            ))
          )}

          <DataTableFooter>
            <div className="flex items-center justify-between w-full">
              <span>Показано {certificates.length} из {total}</span>
              <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
          </DataTableFooter>
        </DataTable>
      ) : (
        <>
          {certificates.length === 0 ? (
            <p className="text-sm text-text-sub text-center py-8">Нет сертификатов в этой категории</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {certificates.map((cert) => (
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
