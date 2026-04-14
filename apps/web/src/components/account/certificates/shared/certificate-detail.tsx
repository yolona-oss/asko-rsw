'use client';

import { useState } from 'react';
import { Badge, DetailRow, DetailSection } from '@asko/ui';
import type { BadgeVariant } from '@asko/ui';
import { api } from '@/lib/api/client';

const fmt = (d: string) =>
  new Date(d).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });

const statusVariant = (s: string): BadgeVariant => {
  switch (s) {
    case 'active': return 'success';
    case 'pending': return 'warning';
    case 'expired': case 'revoked': return 'error';
    default: return 'neutral';
  }
};

export async function fetchCertificateOne(item: any): Promise<any> {
  const { data } = await api.get(`/certificates/${item.id}`, { _silent: true } as any);
  return data?.certificate ?? data;
}

export function CertificateDetail({ item, loading }: { item: any; loading: boolean }) {
  const [device, setDevice] = useState<any>(null);
  const [category, setCategory] = useState<any>(null);
  const [dealerUser, setDealerUser] = useState<any>(null);

  const deviceName = item.userDevice?.device?.name ?? item.device?.name;
  const dealerName = item.dealer?.companyName;
  const deviceId = item.userDevice?.device?.id ?? item.device?.id;
  const address = item.userDevice?.address ?? item.address;

  return (
    <div className="flex flex-col">
      <DetailRow label="Номер" value={item.certificateNumber ?? '-'} />
      <DetailRow label="Статус" value={item.status ? <Badge variant={statusVariant(item.status)}>{item.status}</Badge> : '-'} />
      <DetailRow label="Дата выдачи" value={item.issuedAt ? fmt(item.issuedAt) : '-'} />
      <DetailRow label="Срок действия" value={item.expiresAt ? fmt(item.expiresAt) : '-'} />
      <DetailRow label="Стоимость" value={item.price != null ? `${item.price} \u20BD` : '-'} />

      <DetailSection label="Устройство" summary={loading ? '...' : (deviceName ?? '-')}
        fetchData={deviceId ? async () => { try { const { data } = await api.get(`/devices/${deviceId}`, { _silent: true } as any); setDevice(data); } catch {} } : undefined}>
        {device ? (<>
          <DetailRow label="Название" value={device.name ?? '-'} />
          <DetailRow label="Бренд" value={device.brand ?? '-'} />
          <DetailRow label="Модель" value={device.model ?? '-'} />
          {item.userDevice?.serialNumber && <DetailRow label="Серийный номер" value={item.userDevice.serialNumber} />}
          {device.type && (
            <DetailSection label="Категория" summary={device.type}
              fetchData={async () => { try { const { data } = await api.get(`/device-categories/${device.type}`, { _silent: true } as any); setCategory(data); } catch {} }}>
              {category ? (<>
                <DetailRow label="Название" value={category.name ?? '-'} />
                {category.description && <DetailRow label="Описание" value={category.description} />}
              </>) : <DetailRow label="ID" value={device.type} />}
            </DetailSection>
          )}
        </>) : <DetailRow label="Устройство" value={deviceName ?? '-'} />}
      </DetailSection>

      {address && (
        <DetailSection label="Адрес" summary={[address.city, address.street, address.house].filter(Boolean).join(', ') || '-'}>
          <DetailRow label="Город" value={address.city ?? '-'} />
          {address.street && <DetailRow label="Улица" value={address.street} />}
          {address.house && <DetailRow label="Дом" value={address.house} />}
          {address.apartment && <DetailRow label="Квартира" value={address.apartment} />}
        </DetailSection>
      )}

      {item.dealer && (
        <DetailSection label="Дилер" summary={dealerName ?? '-'}
          fetchData={item.dealer?.userId ? async () => { try { const { data } = await api.post('/users/batch', { ids: [item.dealer.userId] }, { _silent: true } as any); if (data.users?.[0]) setDealerUser(data.users[0]); } catch {} } : undefined}>
          <DetailRow label="Компания" value={item.dealer.companyName ?? '-'} />
          {item.dealer.inn && <DetailRow label="ИНН" value={item.dealer.inn} />}
          <DetailSection label="Пользователь" summary={(dealerUser || item.dealer.user) ? [dealerUser?.lastName ?? item.dealer.user?.lastName, dealerUser?.firstName ?? item.dealer.user?.firstName].filter(Boolean).join(' ') || '-' : '-'}>
            {(dealerUser || item.dealer.user) ? (<>
              <DetailRow label="Имя" value={[dealerUser?.lastName ?? item.dealer.user?.lastName, dealerUser?.firstName ?? item.dealer.user?.firstName].filter(Boolean).join(' ') || '-'} />
              {item.dealer.user?.email && <DetailRow label="Email" value={item.dealer.user.email} />}
              {item.dealer.user?.phone && <DetailRow label="Телефон" value={item.dealer.user.phone} />}
            </>) : <DetailRow label="Данные" value="-" />}
          </DetailSection>
        </DetailSection>
      )}
    </div>
  );
}
