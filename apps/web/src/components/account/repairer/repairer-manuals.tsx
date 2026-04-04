'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useEntityDetail } from '@/hooks/use-entity-detail';
import { EntityDetailModal } from '@/components/account/shared/entity-detail-modal';
import { DeviceDetail, fetchDeviceOne } from '@/components/account/admin/devices/device-detail';
import { deviceApi } from '@/lib/api/device';
import {
  Card,
  DataGrid,
  DataSearch,
  ViewSwitcher,
  VIEW_TABLE,
  VIEW_CARD,
} from '@asko/ui';
import type { DataGridColumn, SortOrder } from '@asko/ui';
import { PageContainer } from '@/components/account/page-container';
import { PageHeader } from '@/components/account/page-header';
import { useDeviceCategories, buildCategoryLabelMap } from '@/hooks/use-device-categories';
import type { IDevice } from '@/lib/api/types';
import Link from 'next/link';

export function RepairerManuals() {
  const router = useRouter();
  const detail = useEntityDetail<IDevice>();
  const [devices, setDevices] = useState<IDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('card');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder | null>(null);
  const { data: categories } = useDeviceCategories();
  const categoryLabels = useMemo(() => buildCategoryLabelMap(categories ?? []), [categories]);

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
      || (categoryLabels[d.type] ?? d.type).toLowerCase().includes(q),
    );
  }, [devices, search]);

  const sortedDevices = useMemo(() => {
    if (!sortBy) return filteredDevices;
    return [...filteredDevices].sort((a, b) => {
      const av = (a as any)[sortBy] ?? '';
      const bv = (b as any)[sortBy] ?? '';
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return sortOrder === 'desc' ? -cmp : cmp;
    });
  }, [filteredDevices, sortBy, sortOrder]);

  const columns: DataGridColumn<IDevice>[] = useMemo(() => [
    {
      key: 'name',
      header: 'Название',
      mobileLabel: 'Название:',
      render: (device) => (
        <p className="text-sm font-medium text-text-main">{device.name}</p>
      ),
    },
    {
      key: 'brandModel',
      header: 'Бренд / Модель',
      mobileLabel: 'Бренд / Модель:',
      render: (device) => (
        <p className="text-sm text-text-main">{device.brand} · {device.model}</p>
      ),
    },
    {
      key: 'type',
      header: 'Тип',
      width: 200,
      mobileLabel: 'Тип:',
      render: (device) => (
        <p className="text-sm text-text-main">{categoryLabels[device.type] ?? device.type}</p>
      ),
    },
  ], [categoryLabels]);

  return (
    <PageContainer>
      <PageHeader>Мануалы</PageHeader>

      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row gap-4 items-stretch">
        <DataSearch value={search} onChange={setSearch} placeholder="Поиск" className="lg:w-[320px] flex-shrink-0" />
      </div>

      {/* ViewSwitcher — above data view */}
      <ViewSwitcher views={[VIEW_TABLE, VIEW_CARD]} activeView={view} onViewChange={setView} />

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-36 bg-[#F5F5F5] animate-pulse rounded" />
          ))}
        </div>
      ) : view === 'table' ? (
        <DataGrid
          columns={columns}
          data={sortedDevices}
          keyExtractor={(device) => device.id}
          emptyContent="Устройства не найдены"
          sortKey={sortBy ?? undefined}
          sortOrder={sortOrder ?? undefined}
          onSort={(key, order) => { setSortBy(key); setSortOrder(order); }}
          onRowClick={detail.onRowClick}
          onRowDoubleClick={(device) => router.push(`/account/man/${device.id}`)}
          footer={<>Показано {sortedDevices.length} из {devices.length}</>}
        />
      ) : (
        <>
          {sortedDevices.length === 0 ? (
            <Card className="text-text-sub text-sm">Устройства не найдены</Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedDevices.map((device) => (
                <Link key={device.id} href={`/account/man/${device.id}`} className="block h-full">
                  <Card padding="none" className="p-5 flex flex-col gap-3 h-full cursor-pointer hover:border-brand-red transition-colors">
                    <div className="flex flex-col gap-1">
                      <p className="text-base font-medium text-text-main">{device.name}</p>
                      <p className="text-xs text-text-sub">{device.brand} · {device.model}</p>
                      <p className="text-xs text-text-sub">
                        {categoryLabels[device.type] ?? device.type}
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
      <EntityDetailModal
        open={detail.open}
        onClose={detail.onClose}
        item={detail.selectedItem}
        title="Детали устройства"
        fetchOne={fetchDeviceOne}
        renderContent={(item, loading) => <DeviceDetail item={item} loading={loading} />}
      />
    </PageContainer>
  );
}
