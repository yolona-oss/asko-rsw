'use client';

import { Badge } from '@asko/ui';
import type { BadgeVariant } from '@asko/ui';
import { DetailRow } from '@/components/account/shared/detail-row';
import { api } from '@/lib/api/client';

const fmt = (d: string) =>
  new Date(d).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });

const statusVariant = (s: string): BadgeVariant => {
  switch (s) {
    case 'active':
      return 'success';
    case 'pending':
      return 'warning';
    case 'expired':
    case 'revoked':
      return 'error';
    default:
      return 'neutral';
  }
};

export async function fetchCertificateOne(item: any): Promise<any> {
  const { data } = await api.get(`/certificates/${(item as any).id}`, { _silent: true } as any);
  return data;
}

export function CertificateDetail({ item, loading }: { item: any; loading: boolean }) {
  const deviceName = item.userDevice?.device?.name ?? item.device?.name;
  const dealerName = item.dealer?.companyName;

  return (
    <div className="flex flex-col">
      <DetailRow label="Номер сертификата" value={item.certificateNumber ?? '-'} />
      <DetailRow
        label="Статус"
        value={
          item.status ? (
            <Badge variant={statusVariant(item.status)}>{item.status}</Badge>
          ) : (
            '-'
          )
        }
      />
      <DetailRow label="Устройство" value={loading ? 'Загрузка...' : (deviceName ?? '-')} />
      <DetailRow label="Дилер" value={loading ? 'Загрузка...' : (dealerName ?? '-')} />
      <DetailRow label="Дата выдачи" value={item.issuedAt ? fmt(item.issuedAt) : '-'} />
      <DetailRow label="Срок действия" value={item.expiresAt ? fmt(item.expiresAt) : '-'} />
      <DetailRow label="Стоимость" value={item.price != null ? `${item.price} \u20BD` : '-'} />
    </div>
  );
}
