'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface FormData {
  name: string;
  type: string;
  model: string;
  brand: string;
  description: string;
  specifications: string;
  link: string;
}

const INITIAL_DATA: FormData = {
  name: '',
  type: '',
  model: '',
  brand: 'ASKO',
  description: '',
  specifications: '',
  link: '',
};

const DEVICE_TYPES = [
  { value: 'washing_machine', label: 'Стиральная машина' },
  { value: 'dryer', label: 'Сушильная машина' },
  { value: 'dishwasher', label: 'Посудомоечная машина' },
  { value: 'oven', label: 'Духовой шкаф' },
  { value: 'cooktop', label: 'Варочная панель' },
  { value: 'refrigerator', label: 'Холодильник' },
  { value: 'freezer', label: 'Морозильник' },
  { value: 'hood', label: 'Вытяжка' },
  { value: 'other', label: 'Другое' },
];

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-base lg:text-lg font-bold text-text-main block mb-2">
      {children}
    </label>
  );
}

export function AdminDeviceForm() {
  const router = useRouter();
  const [data, setData] = useState<FormData>(INITIAL_DATA);

  const update = (partial: Partial<FormData>) => {
    setData((prev) => ({ ...prev, ...partial }));
  };

  const handleSubmit = () => {
    alert('Устройство создано');
    router.push('/account/devices');
  };

  return (
    <div className="p-4 lg:p-8 flex flex-col gap-6 lg:gap-8">
      <h1 className="text-[28px] lg:text-[36px] font-medium tracking-[-0.01em] text-text-main">
        Новое устройство
      </h1>

      <div className="max-w-[600px] flex flex-col gap-6">
        <div>
          <FieldLabel>Название</FieldLabel>
          <input
            type="text"
            placeholder="Введите название..."
            value={data.name}
            onChange={(e) => update({ name: e.target.value })}
            className="w-full max-w-[500px] px-4 py-3 border border-border-light rounded-sm text-sm text-text-main placeholder:text-[#999] bg-white focus:outline-none focus:border-text-main transition-colors"
          />
        </div>

        <div>
          <FieldLabel>Тип устройства</FieldLabel>
          <select
            value={data.type}
            onChange={(e) => update({ type: e.target.value })}
            className="w-full max-w-[500px] px-4 py-3 border border-border-light rounded-sm text-sm text-text-main bg-white focus:outline-none focus:border-text-main transition-colors appearance-none"
          >
            <option value="" disabled>Выберите тип</option>
            {DEVICE_TYPES.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div>
          <FieldLabel>Модель</FieldLabel>
          <input
            type="text"
            placeholder="Введите модель..."
            value={data.model}
            onChange={(e) => update({ model: e.target.value })}
            className="w-full max-w-[500px] px-4 py-3 border border-border-light rounded-sm text-sm text-text-main placeholder:text-[#999] bg-white focus:outline-none focus:border-text-main transition-colors"
          />
        </div>

        <div>
          <FieldLabel>Бренд</FieldLabel>
          <input
            type="text"
            placeholder="Введите бренд..."
            value={data.brand}
            onChange={(e) => update({ brand: e.target.value })}
            className="w-full max-w-[500px] px-4 py-3 border border-border-light rounded-sm text-sm text-text-main placeholder:text-[#999] bg-white focus:outline-none focus:border-text-main transition-colors"
          />
        </div>

        <div>
          <FieldLabel>Описание</FieldLabel>
          <textarea
            placeholder="Описание устройства..."
            value={data.description}
            onChange={(e) => update({ description: e.target.value })}
            rows={4}
            className="w-full max-w-[500px] px-4 py-3 border border-border-light rounded-sm text-sm text-text-main placeholder:text-[#999] bg-white focus:outline-none focus:border-text-main transition-colors resize-none"
          />
        </div>

        <div>
          <FieldLabel>Спецификации (JSON)</FieldLabel>
          <textarea
            placeholder='{"weight": "80kg", "dimensions": "600x850x600mm"}'
            value={data.specifications}
            onChange={(e) => update({ specifications: e.target.value })}
            rows={4}
            className="w-full max-w-[500px] px-4 py-3 border border-border-light rounded-sm text-sm text-text-main placeholder:text-[#999] bg-white focus:outline-none focus:border-text-main transition-colors resize-none font-mono"
          />
        </div>

        <div>
          <FieldLabel>Ссылка</FieldLabel>
          <input
            type="url"
            placeholder="https://..."
            value={data.link}
            onChange={(e) => update({ link: e.target.value })}
            className="w-full max-w-[500px] px-4 py-3 border border-border-light rounded-sm text-sm text-text-main placeholder:text-[#999] bg-white focus:outline-none focus:border-text-main transition-colors"
          />
        </div>

        <div className="flex items-center gap-4 mt-2">
          <button
            type="button"
            onClick={() => router.push('/account/devices')}
            className="px-6 py-2.5 text-sm font-medium text-text-main border border-border-light rounded-sm hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-8 py-2.5 text-sm font-medium text-white bg-brand-red cursor-pointer"
          >
            Создать устройство
          </button>
        </div>
      </div>
    </div>
  );
}
