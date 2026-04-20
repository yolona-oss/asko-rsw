'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useEntityDetail } from '@/hooks/use-entity-detail';
import { EntityDetailModal } from '@/components/account/_shared/entity-detail-modal';
import { CertificateDetail, fetchCertificateOne } from '@/components/account/certificates/shared/certificate-detail';
import {
  Badge,
  DataGrid,
  DataToolbar,
  ViewSwitcher,
  VIEW_TABLE,
  VIEW_CARD,
  Pagination,
  SkeletonCard,
} from '@asko/ui';
import type { DataGridColumn, DropdownMenuEntry, FilterValues, SortOrder } from '@asko/ui';
import { CertificateStatus, formatDate } from '@asko/shared/client';
import { PageContainer } from '@/components/account/layout/page-container';
import { PageHeader } from '@/components/account/layout/page-header';
import { certificateApi } from '@/lib/api/certificate';
import type { CertificateRecord } from '@/lib/api/types';
import { STATUS_FILTER, STATUS_BADGE_VARIANT, STATUS_LABELS } from './constants';
import type { CertTab } from './types';
import { CertificateCard } from './certificate-card';

const PAGE_SIZE = 20;

export function AdminCertificates() {
  const detail = useEntityDetail<CertificateRecord>();
  const [filterValues, setFilterValues] = useState<FilterValues>({ status: 'active' });
  const [certificates, setCertificates] = useState<CertificateRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('table');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder | null>(null);

  const fetchCertificates = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await certificateApi.getAll({
        page: page,
        limit: PAGE_SIZE,
        search: search || undefined,
        status: filterValues.status as string,
        sortBy: sortBy ?? undefined,
        sortOrder: sortOrder ?? undefined,
      });
      setCertificates(data.data ?? []);
      setTotal(data.overallCount ?? 0);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [page, search, filterValues.status, sortBy, sortOrder]);

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

  const columns: DataGridColumn<CertificateRecord>[] = useMemo(() => [
    {
      key: 'certificateNumber',
      header: 'Номер',
      width: 140,
      mobileLabel: 'Номер:',
      render: (cert) => <p className="text-sm font-medium text-text-main">{cert.certificateNumber}</p>,
    },
    {
      key: 'user',
      header: 'Пользователь',
      sortable: false,
      mobileLabel: 'Пользователь:',
      width: 100,
      render: (cert) => {
        const userName = [cert.user?.lastName, cert.user?.firstName].filter(Boolean).join(' ') || '-';
        return <p className="text-sm text-text-main">{userName}</p>;
      },
    },
    {
      key: 'device',
      header: 'Устройство',
      sortable: false,
      mobileLabel: 'Устройство:',
      width: 150,
      render: (cert) => <p className="text-sm text-text-main">{cert.userDevice?.device?.name ?? '-'}</p>,
    },
    {
      key: 'dealer',
      header: 'Дилер',
      sortable: false,
      width: 150,
      mobileLabel: 'Дилер:',
      render: (cert) => {
        const dealerName = cert.dealer?.companyName
          || [cert.dealer?.user?.lastName, cert.dealer?.user?.firstName].filter(Boolean).join(' ')
          || '-';
        return <p className="text-sm text-text-main">{dealerName}</p>;
      },
    },
    {
      key: 'status',
      header: 'Статус',
      width: 130,
      mobileLabel: 'Статус:',
      render: (cert) => (
        <Badge variant={STATUS_BADGE_VARIANT[cert.status as CertTab] ?? 'neutral'}>
          {STATUS_LABELS[cert.status] ?? cert.status}
        </Badge>
      ),
    },
    {
      key: 'issuedAt',
      header: 'Выдан',
      width: 100,
      mobileLabel: 'Выдан:',
      render: (cert) => <p className="text-sm text-text-main">{formatDate(cert.issuedAt)}</p>,
    },
    {
      key: 'expiresAt',
      header: 'Истекает',
      width: 100,
      mobileLabel: 'Истекает:',
      render: (cert) => <p className="text-sm text-text-main">{formatDate(cert.expiresAt)}</p>,
    },
  ], []);

  const rowMenu = (cert: CertificateRecord): DropdownMenuEntry[] => {
    const items: DropdownMenuEntry[] = [];
    if (cert.status === CertificateStatus.ACTIVE) {
      items.push({ key: 'revoke', label: 'Отозвать', variant: 'danger', onClick: () => handleRevoke(cert.id) });
    }
    return items;
  };

  return (
    <PageContainer>
      <PageHeader>Управление сертификатами</PageHeader>

      {/* Toolbar */}
      <DataToolbar
        search={{ value: search, onChange: (v) => { setSearch(v); setPage(1); }, placeholder: "Поиск" }}
        filters={[STATUS_FILTER]}
        filterValues={filterValues}
        onFilterChange={(key: string, value: string | string[]) => { setFilterValues((prev) => ({ ...prev, [key]: value })); setPage(1); }}
        viewSwitcher={<ViewSwitcher views={[VIEW_TABLE, VIEW_CARD]} activeView={view} onViewChange={setView} />}
      />

      {view === 'table' ? (
        <DataGrid
          loading={loading}
          columns={columns}
          data={certificates}
          keyExtractor={(cert) => cert.id}
          emptyContent="Нет сертификатов в этой категории"
          sortKey={sortBy ?? undefined}
          sortOrder={sortOrder ?? undefined}
          onSort={(key, order) => { setSortBy(key); setSortOrder(order); setPage(1); }}
          onRowClick={detail.onRowClick}
          rowMenu={rowMenu}
          footer={
            <div className="flex items-center justify-between w-full">
              <span>Показано {certificates.length} из {total}</span>
              <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
          }
        />
      ) : loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} className="h-36" />)}
        </div>
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
                  onClick={() => detail.onRowClick(cert)}
                />
              ))}
            </div>
          )}
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} className="justify-center mt-6" />
        </>
      )}
      <EntityDetailModal
        open={detail.open}
        onClose={detail.onClose}
        item={detail.selectedItem}
        title="Детали сертификата"
        fetchOne={fetchCertificateOne}
        renderContent={(item, loading) => <CertificateDetail item={item} loading={loading} />}
      />
    </PageContainer>
  );
}
