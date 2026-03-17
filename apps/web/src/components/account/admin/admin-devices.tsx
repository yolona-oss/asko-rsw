'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Button,
  DataTable,
  DataTableHeader,
  DataTableRow,
  DataTableCell,
} from '@asko/ui';
import { PageContainer } from '@/components/account/page-container';
import { PageHeader } from '@/components/account/page-header';
import { adminApi } from '@/lib/api/admin';

const TYPE_LABELS: Record<string, string> = {
  washing_machine: 'Стиральная машина',
  dryer: 'Сушильная машина',
  dishwasher: 'Посудомоечная машина',
  oven: 'Духовой шкаф',
  cooktop: 'Варочная панель',
  refrigerator: 'Холодильник',
  freezer: 'Морозильник',
  hood: 'Вытяжка',
  other: 'Другое',
};

interface Device {
  id: string;
  name: string;
  type: string;
  model: string;
  brand: string;
}

function DeviceRow({ device, onDelete }: { device: Device; onDelete: (id: string) => void }) {
  return (
    <DataTableRow>
      <DataTableCell mobileLabel="Название:" className="lg:w-35 lg:flex-shrink-0">
        <p className="text-sm font-medium text-text-main">{device.name}</p>
      </DataTableCell>
      <DataTableCell mobileLabel="Тип:" className="lg:flex-1 lg:px-4">
        <p className="text-sm text-text-main">{TYPE_LABELS[device.type] ?? device.type}</p>
      </DataTableCell>
      <DataTableCell mobileLabel="Модель:" className="lg:flex-1 lg:px-4">
        <p className="text-sm text-text-main">{device.model}</p>
      </DataTableCell>
      <DataTableCell mobileLabel="Бренд:" className="lg:w-20 lg:px-4">
        <p className="text-sm text-text-main">{device.brand}</p>
      </DataTableCell>
      <DataTableCell className="lg:w-[200px] lg:flex-shrink-0 lg:text-right flex gap-2">
        <Button variant="secondary" size="sm">
          Изменить
        </Button>
        <Button variant="danger" size="sm" onClick={() => onDelete(device.id)}>
          Удалить
        </Button>
      </DataTableCell>
    </DataTableRow>
  );
}

export function AdminDevices() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDevices = async () => {
    try {
      const { data } = await adminApi.getDevices({ limit: 100 });
      setDevices(data.data ?? []);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await adminApi.deleteDevice(id);
      setDevices((prev) => prev.filter((d) => d.id !== id));
    } catch {
      // silently fail
    }
  };

  return (
    <PageContainer>
      <div className="flex items-center justify-between">
        <PageHeader>Товары</PageHeader>
      </div>

      <div className="flex items-start">
        <Link
          href="/account/devices/create"
          className="m-2 px-5 py-2.5 text-sm font-medium text-white bg-brand-red rounded-sm cursor-pointer"
        >
          Добавить товар
        </Link>
      </div>

      {loading ? (
        <p className="text-sm text-text-sub p-4">Загрузка...</p>
      ) : (
        <>
          <DataTableHeader>
            <div className="w-35 flex-shrink-0">Название</div>
            <div className="flex-1 px-4">Тип</div>
            <div className="flex-1 px-4">Модель</div>
            <div className="w-20 px-4">Бренд</div>
            <div className="w-[200px] flex-shrink-0" />
          </DataTableHeader>

          <DataTable>
            {devices.map((device) => (
              <DeviceRow key={device.id} device={device} onDelete={handleDelete} />
            ))}
          </DataTable>
        </>
      )}
    </PageContainer>
  );
}
