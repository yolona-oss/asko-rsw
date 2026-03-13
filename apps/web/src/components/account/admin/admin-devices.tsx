'use client';

import Link from 'next/link';

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
    <div className="flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-0 px-5 py-4 border-b border-border-light last:border-b-0 bg-white">
      <div className="lg:w-[220px] lg:flex-shrink-0">
        <p className="text-xs text-text-sub lg:hidden">Название:</p>
        <p className="text-sm font-medium text-text-main">{device.name}</p>
      </div>
      <div className="lg:flex-1 lg:px-4">
        <p className="text-xs text-text-sub lg:hidden">Тип:</p>
        <p className="text-sm text-text-main">{TYPE_LABELS[device.type] ?? device.type}</p>
      </div>
      <div className="lg:flex-1 lg:px-4">
        <p className="text-xs text-text-sub lg:hidden">Модель:</p>
        <p className="text-sm text-text-main">{device.model}</p>
      </div>
      <div className="lg:w-[120px] lg:px-4">
        <p className="text-xs text-text-sub lg:hidden">Бренд:</p>
        <p className="text-sm text-text-main">{device.brand}</p>
      </div>
      <div className="lg:w-[160px] lg:flex-shrink-0 lg:text-right flex gap-2">
        <button
          type="button"
          className="px-4 py-2 text-sm font-medium text-text-main border border-border-light rounded-sm hover:bg-gray-50 transition-colors cursor-pointer"
        >
          Изменить
        </button>
        <button
          type="button"
          className="px-4 py-2 text-sm font-medium text-brand-red border border-brand-red rounded-sm hover:bg-red-50 transition-colors cursor-pointer"
        >
          Удалить
        </button>
      </div>
    </div>
  );
}

export function AdminDevices() {
  return (
    <div className="p-4 lg:p-8 flex flex-col gap-6 lg:gap-8">
      <div className="flex items-center justify-between">
        <h1 className="text-[28px] lg:text-[36px] font-medium tracking-[-0.01em] text-text-main">
          Устройства
        </h1>
        <Link
          href="/account/devices/create"
          className="px-5 py-2.5 text-sm font-medium text-white bg-brand-red rounded-sm cursor-pointer"
        >
          Добавить устройство
        </Link>
      </div>

      {/* Desktop table header */}
      <div className="hidden lg:flex items-center px-5 py-3 text-xs font-medium text-text-sub uppercase tracking-wider border-b border-border-light">
        <div className="w-[220px] flex-shrink-0">Название</div>
        <div className="flex-1 px-4">Тип</div>
        <div className="flex-1 px-4">Модель</div>
        <div className="w-[120px] px-4">Бренд</div>
        <div className="w-[160px] flex-shrink-0" />
      </div>

      <div className="flex flex-col border border-border-light rounded-sm overflow-hidden">
        {MOCK_DEVICES.map((device) => (
          <DeviceRow key={device.id} device={device} />
        ))}
      </div>
    </div>
  );
}
