'use client';

import {
  Button,
  Badge,
  Card,
} from '@asko/ui';
import { CertificateStatus } from '@asko/shared/client';
import type { ICertificate } from '@/lib/api/types';
import type { CertTab } from './types';
import { STATUS_BADGE_VARIANT, STATUS_LABELS, formatDate } from './constants';

export function CertificateCard({
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
    <Card padding="none" className="p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-text-main">{cert.certificateNumber}</p>
        <Badge variant={STATUS_BADGE_VARIANT[cert.status as CertTab] ?? 'neutral'}>
          {STATUS_LABELS[cert.status] ?? cert.status}
        </Badge>
      </div>
      <div className="flex flex-col gap-1 text-sm">
        <div className="flex justify-between">
          <span className="text-text-sub">Пользователь</span>
          <span className="text-text-main">{userName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-sub">Устройство</span>
          <span className="text-text-main">{deviceName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-sub">Дилер</span>
          <span className="text-text-main">{dealerName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-sub">Действие</span>
          <span className="text-text-main">{formatDate(cert.issuedAt)} - {formatDate(cert.expiresAt)}</span>
        </div>
      </div>
      {showRevoke && (
        <div className="pt-1">
          <Button variant="danger" size="sm" onClick={() => onRevoke(cert.id)}>
            Отозвать
          </Button>
        </div>
      )}
    </Card>
  );
}
