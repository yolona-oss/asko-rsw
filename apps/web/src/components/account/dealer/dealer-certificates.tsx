'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Button,
  Card,
  Select,
  DataTable,
  DataTableHeader,
  DataTableRow,
  DataTableCell,
  DataTableEmpty,
  DataTableFooter,
  ViewSwitcher,
  VIEW_TABLE,
  VIEW_CARD,
  DataSearch,
  DataFilter,
} from '@asko/ui';
import type { FilterDefinition, FilterValues } from '@asko/ui';
import { PageContainer } from '@/components/account/page-container';
import { PageHeader } from '@/components/account/page-header';
import { certificateApi } from '@/lib/api/certificate';
import { CertificateStatus } from '@asko/shared/client';
import type { ICertificate } from '@/lib/api/types';

type StatusFilter = 'all' | CertificateStatus;

const STATUS_TABS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'Все' },
  { key: CertificateStatus.PENDING_PAYMENT, label: 'Ожидают оплаты' },
  { key: CertificateStatus.ACTIVE, label: 'Активные' },
  { key: CertificateStatus.VALIDATION_ERROR, label: 'Ошибка валидации' },
  { key: CertificateStatus.EXPIRED, label: 'Истекшие' },
  { key: CertificateStatus.REVOKED, label: 'Отозванные' },
];

const STATUS_LABELS: Record<string, string> = {
  [CertificateStatus.PENDING_PAYMENT]: 'Ожидает оплаты',
  [CertificateStatus.VALIDATION_ERROR]: 'Ошибка валидации',
  [CertificateStatus.ACTIVE]: 'Активен',
  [CertificateStatus.EXPIRED]: 'Истек',
  [CertificateStatus.REVOKED]: 'Отозван',
};

const STATUS_COLORS: Record<string, string> = {
  [CertificateStatus.PENDING_PAYMENT]: 'text-orange-600',
  [CertificateStatus.VALIDATION_ERROR]: 'text-brand-red',
  [CertificateStatus.ACTIVE]: 'text-green-600',
  [CertificateStatus.EXPIRED]: 'text-text-sub',
  [CertificateStatus.REVOKED]: 'text-brand-red',
};

type SortField = 'createdAt' | 'expiresAt' | 'certificateNumber';

const SORT_OPTIONS: { value: SortField; label: string }[] = [
  { value: 'createdAt', label: 'По дате создания' },
  { value: 'expiresAt', label: 'По сроку действия' },
  { value: 'certificateNumber', label: 'По номеру' },
];

type Certificate = ICertificate;

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

const PAGE_SIZE = 10;

const STATUS_FILTER_DEF: FilterDefinition = {
  key: 'status',
  label: '',
  type: 'tabs',
  options: STATUS_TABS.map((tab) => ({ value: tab.key, label: tab.label })),
};

export function DealerCertificates() {
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
        offset: page,
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
      <div className="flex flex-col gap-4 items-stretch">
        <div className="flex flex-row">
          <div className="flex-shrink-0">
            <DataSearch
              value={search}
              onChange={setSearch}
              placeholder="Поиск по номеру сертификата"
              className="lg:w-[320px]"
            />
          </div>
        </div>
        <div className="flex-shrink-0">
          <DataFilter
            filters={[STATUS_FILTER_DEF]}
            values={filterValues}
            onChange={handleFilterChange}
          />
        </div>
        <div className="flex-1 flex-row flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Select
              value={sortField}
              onChange={(e) => setSortField(e.target.value as SortField)}
              className="w-52"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </Select>
            <div className="ml-auto">
              <ViewSwitcher views={[VIEW_TABLE, VIEW_CARD]} activeView={view} onViewChange={setView} />
            </div>
          </div>
        </div>
      </div>

      {/* Data */}
      {
        loading ? (
          <p className="text-sm text-text-sub p-4">Загрузка...</p>
        ) : view === 'table' ? (
          <DataTable>
            <DataTableHeader>
              <div className="w-[140px] flex-shrink-0">Номер</div>
              <div className="flex-1 px-4">Клиент</div>
              <div className="flex-1 px-4">Устройство</div>
              <div className="w-[100px] px-4">Статус</div>
              <div className="w-[100px] px-4">Выдан</div>
              <div className="w-[100px] px-4">Истекает</div>
            </DataTableHeader>
            {sorted.length === 0 ? (
              <DataTableEmpty>Нет сертификатов</DataTableEmpty>
            ) : (
              sorted.map((cert) => {
                const clientName = [cert.user?.lastName, cert.user?.firstName].filter(Boolean).join(' ')
                  || cert.user?.email || '-';
                const deviceName = cert.userDevice?.device?.name ?? '-';

                return (
                  <DataTableRow key={cert.id}>
                    <DataTableCell mobileLabel="Номер:" className="lg:w-[140px] lg:flex-shrink-0">
                      <p className="text-sm font-medium text-text-main">{cert.certificateNumber}</p>
                    </DataTableCell>
                    <DataTableCell mobileLabel="Клиент:" className="lg:flex-1 lg:px-4">
                      <p className="text-sm text-text-main">{clientName}</p>
                    </DataTableCell>
                    <DataTableCell mobileLabel="Устройство:" className="lg:flex-1 lg:px-4">
                      <p className="text-sm text-text-main">{deviceName}</p>
                    </DataTableCell>
                    <DataTableCell mobileLabel="Статус:" className="lg:w-[100px] lg:px-4">
                      <span className={`text-sm font-medium ${STATUS_COLORS[cert.status] ?? 'text-text-main'}`}>
                        {STATUS_LABELS[cert.status] ?? cert.status}
                      </span>
                    </DataTableCell>
                    <DataTableCell mobileLabel="Выдан:" className="lg:w-[100px] lg:px-4">
                      <p className="text-sm text-text-main">{formatDate(cert.issuedAt)}</p>
                    </DataTableCell>
                    <DataTableCell mobileLabel="Истекает:" className="lg:w-[100px] lg:px-4">
                      <p className="text-sm text-text-main">{formatDate(cert.expiresAt)}</p>
                    </DataTableCell>
                  </DataTableRow>
                );
              })
            )}
            <DataTableFooter>
              Показано {sorted.length} из {total}
            </DataTableFooter>
          </DataTable>
        ) : sorted.length === 0 ? (
          <p className="text-sm text-text-sub text-center py-8">Нет сертификатов</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sorted.map((cert) => {
              const clientName = [cert.user?.lastName, cert.user?.firstName].filter(Boolean).join(' ')
                || cert.user?.email || '-';
              const deviceName = cert.userDevice?.device?.name ?? '-';
              return (
                <Card key={cert.id} padding="none" className="p-5 flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs text-text-sub">{formatDate(cert.issuedAt)} — {formatDate(cert.expiresAt)}</span>
                    <span className={`text-xs font-medium flex-shrink-0 ${STATUS_COLORS[cert.status] ?? 'text-text-main'}`}>
                      {STATUS_LABELS[cert.status] ?? cert.status}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-text-main">{cert.certificateNumber}</p>
                  <p className="text-sm text-text-sub">{clientName} / {deviceName}</p>
                </Card>
              );
            })}
          </div>
        )
      }

      {/* Pagination */}
      {
        totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Назад
            </Button>
            <span className="text-sm text-text-sub">
              {page} / {totalPages}
            </span>
            <Button
              variant="secondary"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Вперед
            </Button>
          </div>
        )
      }
    </PageContainer >
  );
}
