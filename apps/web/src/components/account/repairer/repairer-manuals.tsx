'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { deviceApi } from '@/lib/api/device';
import {
  Card,
  DataTable,
  DataTableHeader,
  DataTableRow,
  DataTableCell,
  DataTableEmpty,
  DataTableFooter,
  DataSearch,
  ViewSwitcher,
  VIEW_TABLE,
  VIEW_CARD,
} from '@asko/ui';
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
  const [view, setView] = useState('card');
  const [search, setSearch] = useState('');

  useEffect(() => {
    deviceApi.getAll()
      .then(({ data }) => setDevices(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filteredDevices = useMemo(() => {
    if (!search) return devices;
    const q = search.toLowerCase();
    return devices.filter((d) =>
      d.name.toLowerCase().includes(q)
      || d.brand?.toLowerCase().includes(q)
      || d.model?.toLowerCase().includes(q)
      || (DEVICE_TYPE_LABEL[d.type] ?? d.type).toLowerCase().includes(q),
    );
  }, [devices, search]);

  return (
    <PageContainer>
      <PageHeader>Мануалы</PageHeader>

      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row gap-4 items-stretch">
        <DataSearch value={search} onChange={setSearch} placeholder="Поиск" className="lg:w-[320px] flex-shrink-0" />
        <div className="flex-1 flex items-center gap-3">
          <div className="ml-auto flex-shrink-0 flex items-center gap-2">
            <ViewSwitcher views={[VIEW_TABLE, VIEW_CARD]} activeView={view} onViewChange={setView} />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-36 bg-[#F5F5F5] animate-pulse rounded" />
          ))}
        </div>
      ) : view === 'table' ? (
        <DataTable>
          <DataTableHeader>
            <div className="flex-1">Название</div>
            <div className="flex-1 px-4">Бренд / Модель</div>
            <div className="w-[200px] px-4">Тип</div>
          </DataTableHeader>

          {filteredDevices.length === 0 ? (
            <DataTableEmpty>Устройства не найдены</DataTableEmpty>
          ) : (
            filteredDevices.map((device) => (
              <Link key={device.id} href={`/account/man/${device.id}`} className="block">
                <DataTableRow className="hover:bg-gray-50 cursor-pointer transition-colors">
                  <DataTableCell mobileLabel="Название:" className="lg:flex-1">
                    <p className="text-sm font-medium text-text-main">{device.name}</p>
                  </DataTableCell>
                  <DataTableCell mobileLabel="Бренд / Модель:" className="lg:flex-1 lg:px-4">
                    <p className="text-sm text-text-main">{device.brand} · {device.model}</p>
                  </DataTableCell>
                  <DataTableCell mobileLabel="Тип:" className="lg:w-[200px] lg:px-4">
                    <p className="text-sm text-text-main">{DEVICE_TYPE_LABEL[device.type] ?? device.type}</p>
                  </DataTableCell>
                </DataTableRow>
              </Link>
            ))
          )}

          <DataTableFooter>
            Показано {filteredDevices.length} из {devices.length}
          </DataTableFooter>
        </DataTable>
      ) : (
        <>
          {filteredDevices.length === 0 ? (
            <Card className="text-text-sub text-sm">Устройства не найдены</Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDevices.map((device) => (
                <Link key={device.id} href={`/account/man/${device.id}`} className="block h-full">
                  <Card padding="none" className="p-5 flex flex-col gap-3 h-full cursor-pointer hover:border-brand-red transition-colors">
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
        </>
      )}
    </PageContainer>
  );
}
