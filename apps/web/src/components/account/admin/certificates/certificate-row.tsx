'use client';

import {
  Button,
  Badge,
  DataTableRow,
  DataTableCell,
} from '@asko/ui';
import { CertificateStatus } from '@asko/shared/client';
import type { ICertificate } from '@/lib/api/types';
import type { CertTab } from './types';
import { STATUS_BADGE_VARIANT, STATUS_LABELS, formatDate } from './constants';

export function CertificateRow({
  cert,
  onRevoke,
}: {
  cert: ICertificate;
  onRevoke: (id: string) => void;
}) {
  const showRevoke = cert.status === CertificateStatus.ACTIVE;
  const userName = [cert.user?.lastName, cert.user?.firstName].filter(Boolean).join(' ') || '-';
  const deviceName = cert.userDevice?.device?.name ?? '-';
  const dealerName = cert.dealer?.companyName
    || [cert.dealer?.user?.lastName, cert.dealer?.user?.firstName].filter(Boolean).join(' ')
    || '-';

  return (
    <DataTableRow>
      <DataTableCell mobileLabel="Номер:" className="lg:w-[140px] lg:flex-shrink-0">
        <p className="text-sm font-medium text-text-main">{cert.certificateNumber}</p>
      </DataTableCell>
      <DataTableCell mobileLabel="Пользователь:" className="lg:flex-1 lg:px-4">
        <p className="text-sm text-text-main">{userName}</p>
      </DataTableCell>
      <DataTableCell mobileLabel="Устройство:" className="lg:flex-1 lg:px-4">
        <p className="text-sm text-text-main">{deviceName}</p>
      </DataTableCell>
      <DataTableCell mobileLabel="Дилер:" className="lg:w-[150px] lg:px-4">
        <p className="text-sm text-text-main">{dealerName}</p>
      </DataTableCell>
      <DataTableCell mobileLabel="Статус:" className="lg:w-[130px] lg:px-4">
        <Badge variant={STATUS_BADGE_VARIANT[cert.status as CertTab] ?? 'neutral'}>
          {STATUS_LABELS[cert.status] ?? cert.status}
        </Badge>
      </DataTableCell>
      <DataTableCell mobileLabel="Выдан:" className="lg:w-[100px] lg:px-4">
        <p className="text-sm text-text-main">{formatDate(cert.issuedAt)}</p>
      </DataTableCell>
      <DataTableCell mobileLabel="Истекает:" className="lg:w-[100px] lg:px-4">
        <p className="text-sm text-text-main">{formatDate(cert.expiresAt)}</p>
      </DataTableCell>
      <DataTableCell className="lg:w-[120px] lg:flex-shrink-0 lg:text-right">
        {showRevoke && (
          <Button variant="danger" size="sm" onClick={() => onRevoke(cert.id)}>
            Отозвать
          </Button>
        )}
      </DataTableCell>
    </DataTableRow>
  );
}
