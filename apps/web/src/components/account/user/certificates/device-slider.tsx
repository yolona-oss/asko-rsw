'use client';

import { AddressView } from '@asko/ui';
import type { UserDevice } from './types';

export function DeviceSlider({
  devices,
  loading,
}: {
  devices: UserDevice[];
  loading: boolean;
}) {
  if (loading) return <p className="text-sm text-text-sub">Загрузка устройств...</p>;
  if (devices.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-lg font-bold text-text-main">Мои устройства</h2>
      <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-thin">
        {devices.map((ud) => {
          const name = ud.device?.name ?? 'Устройство';
          const subtitle = [ud.device?.brand, ud.device?.model].filter(Boolean).join(' ');
          return (
            <div
              key={ud.id}
              className="flex-shrink-0 w-[260px] border border-border-light rounded-sm p-4 flex flex-col gap-2"
            >
              <p className="text-sm font-medium text-text-main truncate">{name}</p>
              {subtitle && <p className="text-xs text-text-sub truncate">{subtitle}</p>}
              {ud.serialNumber && (
                <p className="text-xs text-text-sub">S/N: {ud.serialNumber}</p>
              )}
              <AddressView
                address={ud.address}
                variant="compact"
                fallback=""
                className="text-xs text-text-sub truncate"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
