'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Button,
  Input,
  Select,
  TabList,
  Tab,
  DataTable,
  DataTableHeader,
  DataTableRow,
  DataTableCell,
  DataTableEmpty,
} from '@asko/ui';
import { PageContainer } from '@/components/account/page-container';
import { PageHeader } from '@/components/account/page-header';
import { dealerApi } from '@/lib/api/dealer';
import { CertificateStatus } from '@asko/shared/client';

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

interface Certificate {
  id: string;
  certificateNumber: string;
  status: CertificateStatus;
  issuedAt: Date | string;
  expiresAt: Date | string;
  createdAt: Date | string;
  user?: { firstName?: string; lastName?: string; email?: string };
  userDevice?: { device?: { name?: string } };
}

function formatDate(dateStr: Date | string) {
  return new Date(dateStr).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

const PAGE_SIZE = 10;

export function DealerCertificates() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [sortField, setSortField] = useState<SortField>('createdAt');

  const fetchCertificates = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {
        offset: page,
        limit: PAGE_SIZE,
      };
      if (statusFilter !== 'all') params.status = statusFilter;
      if (search) params.search = search;

      const { data } = await dealerApi.getCertificates(params);
      const list = data.data ?? (Array.isArray(data) ? data : []);
      setCertificates(list);
      setTotal(data.total ?? list.length);
    } catch {
      // silently fail
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

  const handleSearch = () => {
    setSearch(searchInput);
  };

  const sorted = [...certificates].sort((a, b) => {
    if (sortField === 'certificateNumber') return a.certificateNumber.localeCompare(b.certificateNumber);
    const dateA = new Date(a[sortField]).getTime();
    const dateB = new Date(b[sortField]).getTime();
    return dateB - dateA;
  });

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <PageContainer>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader>Сертификаты</PageHeader>
        <Link href="/account/certificates/create">
          <Button variant="primary" size="sm">Создать сертификат</Button>
        </Link>
      </div>

      {/* Tabs */}
      <TabList>
        {STATUS_TABS.map((tab) => (
          <Tab
            key={tab.key}
            active={statusFilter === tab.key}
            onClick={() => setStatusFilter(tab.key)}
          >
            {tab.label}
          </Tab>
        ))}
      </TabList>

      {/* Search + Sort controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-2 flex-1">
          <Input
            placeholder="Поиск по номеру..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-1"
          />
          <Button variant="secondary" size="sm" onClick={handleSearch}>
            Найти
          </Button>
        </div>
        <Select
          value={sortField}
          onChange={(e) => setSortField(e.target.value as SortField)}
          className="sm:w-52"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </Select>
      </div>

      {loading ? (
        <p className="text-sm text-text-sub p-4">Загрузка...</p>
      ) : (
        <>
          <DataTableHeader>
            <div className="w-[140px] flex-shrink-0">Номер</div>
            <div className="flex-1 px-4">Клиент</div>
            <div className="flex-1 px-4">Устройство</div>
            <div className="w-[100px] px-4">Статус</div>
            <div className="w-[100px] px-4">Выдан</div>
            <div className="w-[100px] px-4">Истекает</div>
          </DataTableHeader>

          <DataTable>
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
          </DataTable>

          {/* Pagination */}
          {totalPages > 1 && (
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
          )}
        </>
      )}
    </PageContainer>
  );
}
