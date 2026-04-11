'use client';

import { useEffect, useMemo, useState } from 'react';
import { AddressView, Badge, DataCard } from '@asko/ui';
import type { DropdownMenuEntry } from '@asko/ui';
import { CertificateStatus } from '@asko/shared/client';
import { deviceApi } from '@/lib/api/device';
import { getImageUrl } from '@/lib/image-url';
import { getPlaceholderSrc } from '@/lib/placeholders';
import type { ICertificate } from '@/lib/api/types';
import type { UserDevice } from './types';

type DeviceCertKind = 'none' | 'active' | 'expired';

function resolveKind(deviceId: string, certificates: ICertificate[]): DeviceCertKind {
  const forDevice = certificates.filter(
    (c) =>
      c.userDeviceId === deviceId &&
      c.status !== CertificateStatus.REVOKED &&
      c.status !== CertificateStatus.VALIDATION_ERROR,
  );
  if (forDevice.length === 0) return 'none';
  const now = Date.now();
  const hasActive = forDevice.some(
    (c) =>
      (c.status === CertificateStatus.ACTIVE ||
        c.status === CertificateStatus.PENDING_PAYMENT) &&
      new Date(c.expiresAt).getTime() >= now,
  );
  if (hasActive) return 'active';
  const hasExpired = forDevice.some(
    (c) =>
      c.status === CertificateStatus.EXPIRED ||
      new Date(c.expiresAt).getTime() < now,
  );
  return hasExpired ? 'expired' : 'none';
}

export function DeviceSlider({
  devices,
  certificates,
  loading,
  onEditAddress,
}: {
  devices: UserDevice[];
  certificates: ICertificate[];
  loading: boolean;
  onEditAddress?: (device: UserDevice) => void;
}) {
  if (loading) return <p className="text-sm text-text-sub">Загрузка устройств...</p>;
  if (devices.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-lg font-bold text-text-main">Мои устройства</h2>
      <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-thin">
        {devices.map((ud) => (
          <DeviceSliderCard
            key={ud.id}
            device={ud}
            certificates={certificates}
            onEditAddress={onEditAddress}
          />
        ))}
      </div>
    </div>
  );
}

function DeviceSliderCard({
  device,
  certificates,
  onEditAddress,
}: {
  device: UserDevice;
  certificates: ICertificate[];
  onEditAddress?: (device: UserDevice) => void;
}) {
  const certKind = useMemo(
    () => resolveKind(device.id, certificates),
    [device.id, certificates],
  );
  const deviceId = device.device?.id;
  const [imageUrl, setImageUrl] = useState<string>(() =>
    getPlaceholderSrc('device', deviceId),
  );

  useEffect(() => {
    if (!deviceId) return;
    deviceApi
      .getImages(deviceId)
      .then(({ data }) => {
        const images = (data.images ?? []).slice().sort((a, b) => a.order - b.order);
        if (images.length > 0) {
          const url = getImageUrl(images[0], 'thumbnail');
          if (url) setImageUrl(url);
        }
      })
      .catch(() => {});
  }, [deviceId]);

  const name = device.device?.name ?? 'Устройство';
  const subtitle = [device.device?.brand, device.device?.model].filter(Boolean).join(' ');

  const menuItems: DropdownMenuEntry[] = onEditAddress
    ? [{ key: 'edit-address', label: 'Изменить адрес', onClick: () => onEditAddress(device) }]
    : [];

  return (
    <DataCard
      padding="sm"
      menuItems={menuItems}
      className="flex-shrink-0 w-[320px]"
    >
      <div className="flex flex-row items-center gap-4">
        <img
          src={imageUrl}
          alt={name}
          className="w-16 h-16 flex-shrink-0 object-contain"
        />
        <div className="flex flex-col gap-0.5 min-w-0 flex-1">
          <div className="flex items-center gap-2 min-w-0">
            <p className="text-sm font-medium text-text-main truncate">{name}</p>
            {certKind === 'expired' && (
              <Badge variant="error" className="flex-shrink-0">Сертификат истёк</Badge>
            )}
          </div>
          {subtitle && <p className="text-xs text-text-sub truncate">{subtitle}</p>}
          {device.serialNumber && (
            <p className="text-xs text-text-sub truncate">S/N: {device.serialNumber}</p>
          )}
          <AddressView
            address={device.address}
            variant="compact"
            fallback=""
            className="text-xs text-text-sub truncate"
          />
        </div>
      </div>
    </DataCard>
  );
}
