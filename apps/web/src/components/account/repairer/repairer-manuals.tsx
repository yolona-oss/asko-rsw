'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { deviceApi } from '@/lib/api/device';
import { Card } from '@asko/ui';
import { PageContainer } from '@/components/account/page-container';
import { PageHeader } from '@/components/account/page-header';
import type { IDevice } from '@/lib/api/types';

const DEVICE_TYPE_LABEL: Record<string, string> = {
  washing_machine: 'Стиральная машина',
  dryer: 'Сушильная машина',
  dishwasher: 'Посудомоечная машина',
  oven: 'Духовой шкаф',
  cooktop: 'Варочная поверхность',
  refrigerator: 'Холодильник',
  freezer: 'Морозильник',
  hood: 'Вытяжка',
  other: 'Прочее',
};

export function RepairerManuals() {
  const [devices, setDevices] = useState<IDevice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    deviceApi.getAll()
      .then(({ data }) => setDevices(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <PageContainer>
      <PageHeader>Мануалы</PageHeader>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-36 bg-[#F5F5F5] animate-pulse rounded" />
          ))}
        </div>
      ) : devices.length === 0 ? (
        <Card className="text-text-sub text-sm">Устройства не найдены</Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {devices.map((device) => (
            <Link key={device.id} href={`/account/man/${device.id}`} className="block h-full">
              <Card className="flex flex-col gap-2 h-full cursor-pointer hover:border-brand-red transition-colors">
                <div className="flex flex-col gap-1">
                  <p className="text-base font-medium text-text-main">{device.name}</p>
                  <p className="text-xs text-text-sub">{device.brand} · {device.model}</p>
                  <p className="text-xs text-text-sub">
                    {DEVICE_TYPE_LABEL[device.type] ?? device.type}
                  </p>
                </div>
                {device.description && (
                  <p className="text-xs text-text-sub line-clamp-2 mt-auto">{device.description}</p>
                )}
              </Card>
            </Link>
          ))}
        </div>
      )}
    </PageContainer>
  );
}
