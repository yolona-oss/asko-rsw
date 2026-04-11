'use client';

import { useEffect, useState } from 'react';
import { AddressView, DataCard } from '@asko/ui';
import type { DropdownMenuEntry } from '@asko/ui';
import { deviceApi } from '@/lib/api/device';
import { getImageUrl } from '@/lib/image-url';
import { getPlaceholderSrc } from '@/lib/placeholders';
import type { UserDevice } from './types';

export function DeviceSlider({
  devices,
  loading,
  onEditAddress,
}: {
  devices: UserDevice[];
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
            onEditAddress={onEditAddress}
          />
        ))}
      </div>
    </div>
  );
}

function DeviceSliderCard({
  device,
  onEditAddress,
}: {
  device: UserDevice;
  onEditAddress?: (device: UserDevice) => void;
}) {
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
          <p className="text-sm font-medium text-text-main truncate">{name}</p>
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
