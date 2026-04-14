'use client';

import { Card } from '@asko/ui';
import { useClickHandlers } from '@/hooks/use-click-handlers';
import type { Certificate } from './types';
import { STATUS_LABELS, STATUS_COLORS, formatDate } from './constants';

function CertificateCardItem({
  cert,
  onClick,
}: {
  cert: Certificate;
  onClick?: () => void;
}) {
  const { handleClick } = useClickHandlers(onClick);
  const clientName = [cert.user?.lastName, cert.user?.firstName].filter(Boolean).join(' ')
    || cert.user?.email || '-';
  const deviceName = cert.userDevice?.device?.name ?? '-';

  return (
    <Card padding="none" className={`p-5 flex flex-col gap-3${onClick ? ' cursor-pointer' : ''}`} onClick={handleClick}>
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs text-text-sub">{formatDate(cert.issuedAt)} - {formatDate(cert.expiresAt)}</span>
        <span className={`text-xs font-medium flex-shrink-0 ${STATUS_COLORS[cert.status] ?? 'text-text-main'}`}>
          {STATUS_LABELS[cert.status] ?? cert.status}
        </span>
      </div>
      <p className="text-sm font-medium text-text-main">{cert.certificateNumber}</p>
      <p className="text-sm text-text-sub">{clientName} / {deviceName}</p>
    </Card>
  );
}

export function CertificateCards({
  certificates,
  onCardClick,
}: {
  certificates: Certificate[];
  onCardClick?: (cert: Certificate) => void;
}) {
  if (certificates.length === 0) {
    return <p className="text-sm text-text-sub text-center py-8">Нет сертификатов</p>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {certificates.map((cert) => (
        <CertificateCardItem
          key={cert.id}
          cert={cert}
          onClick={onCardClick ? () => onCardClick(cert) : undefined}
        />
      ))}
    </div>
  );
}
