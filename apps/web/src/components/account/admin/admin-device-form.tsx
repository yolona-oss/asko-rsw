'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input, Select, Textarea, FormField } from '@asko/ui';
import { PageContainer } from '@/components/account/page-container';
import { PageHeader } from '@/components/account/page-header';
import { adminApi } from '@/lib/api/admin';

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

export function AdminDeviceForm() {
  const router = useRouter();
  const [data, setData] = useState<FormData>(INITIAL_DATA);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const update = (partial: Partial<FormData>) => {
    setData((prev) => ({ ...prev, ...partial }));
  };

  const handleSubmit = async () => {
    setError('');
    setSubmitting(true);
    try {
      let specifications: Record<string, unknown> | undefined;
      if (data.specifications.trim()) {
        try {
          specifications = JSON.parse(data.specifications);
        } catch {
          setError('Некорректный JSON в спецификациях');
          setSubmitting(false);
          return;
        }
      }

      await adminApi.createDevice({
        name: data.name,
        type: data.type,
        model: data.model,
        brand: data.brand,
        description: data.description || undefined,
        specifications,
        link: data.link || undefined,
      });

      router.push('/account/devices');
    } catch {
      setError('Ошибка при создании товара');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader>Новый товар</PageHeader>

      <div className="max-w-[600px] flex flex-col gap-6">
        <FormField label="Название" variant="bold">
          <Input
            type="text"
            placeholder="Введите название..."
            value={data.name}
            onChange={(e) => update({ name: e.target.value })}
            className="max-w-[500px]"
          />
        </FormField>

        <FormField label="Тип товара" variant="bold">
          <Select
            value={data.type}
            onChange={(e) => update({ type: e.target.value })}
            className="max-w-[500px]"
          >
            <option value="" disabled>Выберите тип</option>
            {DEVICE_TYPES.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </Select>
        </FormField>

        <FormField label="Модель" variant="bold">
          <Input
            type="text"
            placeholder="Введите модель..."
            value={data.model}
            onChange={(e) => update({ model: e.target.value })}
            className="max-w-[500px]"
          />
        </FormField>

        <FormField label="Бренд" variant="bold">
          <Input
            type="text"
            placeholder="Введите бренд..."
            value={data.brand}
            onChange={(e) => update({ brand: e.target.value })}
            className="max-w-[500px]"
          />
        </FormField>

        <FormField label="Описание" variant="bold">
          <Textarea
            placeholder="Описание товара..."
            value={data.description}
            onChange={(e) => update({ description: e.target.value })}
            rows={4}
            className="max-w-[500px]"
          />
        </FormField>

        <FormField label="Спецификации (JSON)" variant="bold">
          <Textarea
            placeholder='{"weight": "80kg", "dimensions": "600x850x600mm"}'
            value={data.specifications}
            onChange={(e) => update({ specifications: e.target.value })}
            rows={4}
            className="max-w-[500px] font-mono"
          />
        </FormField>

        <FormField label="Ссылка" variant="bold">
          <Input
            type="url"
            placeholder="https://..."
            value={data.link}
            onChange={(e) => update({ link: e.target.value })}
            className="max-w-[500px]"
          />
        </FormField>

        {error && <p className="text-sm text-brand-red">{error}</p>}

        <div className="flex items-center gap-4 mt-2">
          <Button variant="secondary" onClick={() => router.push('/account/devices')}>
            Отмена
          </Button>
          <Button variant="primary" size="lg" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Создание...' : 'Создать товар'}
          </Button>
        </div>
      </div>
    </PageContainer>
  );
}
