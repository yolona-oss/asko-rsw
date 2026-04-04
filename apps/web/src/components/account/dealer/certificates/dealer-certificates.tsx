'use client';

import { useState, useEffect, useCallback } from 'react';
import { useEntityDetail } from '@/hooks/use-entity-detail';
import { EntityDetailModal } from '@/components/account/shared/entity-detail-modal';
import { CertificateDetail, fetchCertificateOne } from '@/components/account/shared/certificate-detail';
import {
  Select,
  DataToolbar,
  ViewSwitcher,
  VIEW_TABLE,
  VIEW_CARD,
  Pagination,
} from '@asko/ui';
import type { FilterValues } from '@asko/ui';
import { PageContainer } from '@/components/account/page-container';
import { PageHeader } from '@/components/account/page-header';
import { certificateApi } from '@/lib/api/certificate';
import type { StatusFilter, SortField, Certificate } from './types';
import { SORT_OPTIONS, PAGE_SIZE, STATUS_FILTER_DEF } from './constants';
import { CertificateTable } from './certificate-table';
import { CertificateCards } from './certificate-cards';

export function DealerCertificates() {
  const detail = useEntityDetail<Certificate>();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filterValues, setFilterValues] = useState<FilterValues>({ status: 'all' });
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [view, setView] = useState('table');

  const statusFilter = filterValues.status as StatusFilter;

  const fetchCertificates = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {
        page: page,
        limit: PAGE_SIZE,
      };
      if (statusFilter !== 'all') params.status = statusFilter;
      if (search) params.search = search;

      const { data } = await certificateApi.getDealer(params);
      const list = data.data ?? (Array.isArray(data) ? data : []);
      setCertificates(list);
      setTotal(data.overallCount ?? list.length);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search]);

  useEffect(() => {
    fetchCertificates();
  }, [fetchCertificates]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [statusFilter, search]);

  const sorted = [...certificates].sort((a, b) => {
    if (sortField === 'certificateNumber') return a.certificateNumber.localeCompare(b.certificateNumber);
    const dateA = new Date(a[sortField]).getTime();
    const dateB = new Date(b[sortField]).getTime();
    return dateB - dateA;
  });

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const handleFilterChange = (key: string, value: string) => {
    setFilterValues((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  return (
    <PageContainer>
      <PageHeader>Сертификаты</PageHeader>

      {/* Toolbar */}
      <DataToolbar
        search={{ value: search, onChange: setSearch, placeholder: "Поиск по номеру сертификата" }}
        filters={[STATUS_FILTER_DEF]}
        filterValues={filterValues}
        onFilterChange={handleFilterChange}
        actions={
          <Select
            value={sortField}
            onChange={(e) => setSortField(e.target.value as SortField)}
            className="w-52"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </Select>
        }
      />

      {/* ViewSwitcher — above data view */}
      <ViewSwitcher views={[VIEW_TABLE, VIEW_CARD]} activeView={view} onViewChange={setView} />

      {/* Data */}
      {
        loading ? (
          <p className="text-sm text-text-sub p-4">Загрузка...</p>
        ) : view === 'table' ? (
          <CertificateTable certificates={sorted} total={total} />
        ) : (
          <CertificateCards certificates={sorted} onCardClick={detail.onRowClick} />
        )
      }

      {/* Pagination */}
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} className="justify-center mt-6" />
      <EntityDetailModal
        open={detail.open}
        onClose={detail.onClose}
        item={detail.selectedItem}
        title="Детали сертификата"
        fetchOne={fetchCertificateOne}
        renderContent={(item, loading) => <CertificateDetail item={item} loading={loading} />}
      />
    </PageContainer >
  );
}
