'use client';

import { DataGrid } from '@asko/ui';
import type { DataGridColumn } from '@asko/ui';
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
  return (
    <DataGrid
      columns={columns}
      data={certificates}
      keyExtractor={(cert) => cert.id}
      emptyContent="Нет сертификатов"
      footer={<>Показано {certificates.length} из {total}</>}
    />
  );
}
