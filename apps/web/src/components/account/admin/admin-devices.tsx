'use client';

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

interface Device {
  id: string;
  name: string;
  type: string;
  model: string;
  brand: string;
}

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

const MOCK_DEVICES: Device[] = [
  { id: 'd1', name: 'ASKO W4114C.W', type: 'washing_machine', model: 'W4114C.W', brand: 'ASKO' },
  { id: 'd2', name: 'ASKO T408HD.W', type: 'dryer', model: 'T408HD.W', brand: 'ASKO' },
  { id: 'd3', name: 'ASKO DFI746U', type: 'dishwasher', model: 'DFI746U', brand: 'ASKO' },
  { id: 'd4', name: 'ASKO OCS8664S', type: 'oven', model: 'OCS8664S', brand: 'ASKO' },
  { id: 'd5', name: 'ASKO HI1611G', type: 'cooktop', model: 'HI1611G', brand: 'ASKO' },
  { id: 'd6', name: 'ASKO R22838S', type: 'refrigerator', model: 'R22838S', brand: 'ASKO' },
];

function DeviceRow({ device }: { device: Device }) {
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
        <Button variant="danger" size="sm">
          Удалить
        </Button>
      </DataTableCell>
    </DataTableRow>
  );
}

export function AdminDevices() {
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

      <DataTableHeader>
        <div className="w-35 flex-shrink-0">Название</div>
        <div className="flex-1 px-4">Тип</div>
        <div className="flex-1 px-4">Модель</div>
        <div className="w-20 px-4">Бренд</div>
        <div className="w-[200px] flex-shrink-0" />
      </DataTableHeader>

      <DataTable>
        {MOCK_DEVICES.map((device) => (
          <DeviceRow key={device.id} device={device} />
        ))}
      </DataTable>
    </PageContainer>
  );
}
