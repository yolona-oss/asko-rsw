'use client';

import { useState, useMemo } from 'react';
import { useEntityDetail } from '@/hooks/use-entity-detail';
import { EntityDetailModal } from '@/components/account/shared/entity-detail-modal';
import { CertificateDetail, fetchCertificateOne } from '@/components/account/shared/certificate-detail';
import { DataGrid } from '@asko/ui';
import type { DataGridColumn, SortOrder } from '@asko/ui';
import type { Certificate } from './types';
import { STATUS_LABELS, STATUS_COLORS, formatDate } from './constants';

const columns: DataGridColumn<Certificate>[] = [
  {
    key: 'number',
    header: 'Номер',
    width: 140,
    mobileLabel: 'Номер:',
    render: (cert) => (
      <p className="text-sm font-medium text-text-main">{cert.certificateNumber}</p>
    ),
  },
  {
    key: 'client',
    header: 'Клиент',
    mobileLabel: 'Клиент:',
    render: (cert) => {
      const clientName = [cert.user?.lastName, cert.user?.firstName].filter(Boolean).join(' ')
        || cert.user?.email || '-';
      return <p className="text-sm text-text-main">{clientName}</p>;
    },
  },
  {
    key: 'device',
    header: 'Устройство',
    mobileLabel: 'Устройство:',
    render: (cert) => {
      const deviceName = cert.userDevice?.device?.name ?? '-';
      return <p className="text-sm text-text-main">{deviceName}</p>;
    },
  },
  {
    key: 'status',
    header: 'Статус',
    width: 100,
    mobileLabel: 'Статус:',
    render: (cert) => (
      <span className={`text-sm font-medium ${STATUS_COLORS[cert.status] ?? 'text-text-main'}`}>
        {STATUS_LABELS[cert.status] ?? cert.status}
      </span>
    ),
  },
  {
    key: 'issuedAt',
    header: 'Выдан',
    width: 100,
    mobileLabel: 'Выдан:',
    render: (cert) => (
      <p className="text-sm text-text-main">{formatDate(cert.issuedAt)}</p>
    ),
  },
  {
    key: 'expiresAt',
    header: 'Истекает',
    width: 100,
    mobileLabel: 'Истекает:',
    render: (cert) => (
      <p className="text-sm text-text-main">{formatDate(cert.expiresAt)}</p>
    ),
  },
];

export function CertificateTable({
  certificates,
  total,
}: {
  certificates: Certificate[];
  total: number;
}) {
  const detail = useEntityDetail<Certificate>();
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder | null>(null);

  const sortedCertificates = useMemo(() => {
    if (!sortBy) return certificates;
    return [...certificates].sort((a, b) => {
      const av = (a as any)[sortBy] ?? '';
      const bv = (b as any)[sortBy] ?? '';
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return sortOrder === 'desc' ? -cmp : cmp;
    });
  }, [certificates, sortBy, sortOrder]);

  return (
    <>
      <DataGrid
        columns={columns}
        data={sortedCertificates}
        keyExtractor={(cert) => cert.id}
        emptyContent="Нет сертификатов"
        sortKey={sortBy ?? undefined}
        sortOrder={sortOrder ?? undefined}
        onSort={(key, order) => { setSortBy(key); setSortOrder(order); }}
        onRowClick={detail.onRowClick}
        footer={<>Показано {certificates.length} из {total}</>}
      />
      <EntityDetailModal
        open={detail.open}
        onClose={detail.onClose}
        item={detail.selectedItem}
        title="Детали сертификата"
        fetchOne={fetchCertificateOne}
        renderContent={(item, loading) => <CertificateDetail item={item} loading={loading} />}
      />
    </>
  );
}
