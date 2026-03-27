'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input, Select, Textarea, FormField, KeyValueEditor, kvToRecord, recordToKV } from '@asko/ui';
import type { KVPair } from '@asko/ui';
import { PageContainer } from '@/components/account/page-container';
import { PageHeader } from '@/components/account/page-header';
import { deviceApi } from '@/lib/api/device';
import type { DeviceType } from '@asko/shared/client';
import type { FormData, AdminDeviceFormProps } from './types';
import { INITIAL_DATA, DEVICE_TYPES } from './constants';
import { DeviceImages } from './device-images';
import { DeviceParts } from './device-parts';

export function AdminDeviceForm({ deviceId }: AdminDeviceFormProps) {
  const router = useRouter();
  const [data, setData] = useState<FormData>(INITIAL_DATA);
  const [specifications, setSpecifications] = useState<KVPair[]>([]);
  const [features, setFeatures] = useState<KVPair[]>([]);
  const [loading, setLoading] = useState(!!deviceId);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const isEdit = !!deviceId;

  useEffect(() => {
    if (!deviceId) return;
    deviceApi
      .getOne(deviceId)
      .then(({ data: device }) => {
        setData({
          name: device.name ?? '',
          type: device.type ?? '',
          model: device.model ?? '',
          brand: device.brand ?? '',
          description: device.description ?? '',
          slug: device.slug ?? '',
        });
        setSpecifications(recordToKV(device.specifications));
        setFeatures(recordToKV(device.features));
      })
      .catch(() => setError('Не удалось загрузить товар'))
      .finally(() => setLoading(false));
  }, [deviceId]);

  const update = (partial: Partial<FormData>) => {
    setData((prev) => ({ ...prev, ...partial }));
  };

  const handleSubmit = async () => {
    setError('');
    setSubmitting(true);
    try {
      const payload = {
        name: data.name,
        type: data.type as DeviceType,
        model: data.model,
        brand: data.brand,
        description: data.description || undefined,
        specifications: kvToRecord(specifications),
        features: kvToRecord(features),
        slug: data.slug || Math.random().toString(36).substring(2, 2 + 10),
      };

      if (isEdit) {
        await deviceApi.update(deviceId, payload);
      } else {
        await deviceApi.create(payload);
      }

      router.push('/account/devices');
    } catch {
      setError(isEdit ? 'Ошибка при обновлении товара' : 'Ошибка при создании товара');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <p className="text-sm text-text-sub p-4">Загрузка...</p>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader>{isEdit ? 'Редактирование товара' : 'Новый товар'}</PageHeader>

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

        <FormField label="Спецификации" variant="bold">
          <KeyValueEditor pairs={specifications} onChange={setSpecifications} />
        </FormField>

        <FormField label="Характеристики" variant="bold">
          <KeyValueEditor pairs={features} onChange={setFeatures} />
        </FormField>

        <FormField label="Slug (URL)" variant="bold">
          <Input
            type="text"
            placeholder="asko-w6098x"
            value={data.slug}
            onChange={(e) => update({ slug: e.target.value })}
            className="max-w-[500px]"
          />
        </FormField>

        {isEdit && deviceId && (
          <FormField label="Изображения" variant="bold">
            <DeviceImages deviceId={deviceId} />
          </FormField>
        )}

        {isEdit && deviceId && (
          <FormField label="Запчасти" variant="bold">
            <DeviceParts deviceId={deviceId} />
          </FormField>
        )}

        {error && <p className="text-sm text-brand-red">{error}</p>}

        <div className="flex items-center gap-4 mt-2">
          <Button variant="secondary" onClick={() => router.push('/account/devices')}>
            Отмена
          </Button>
          <Button variant="primary" size="lg" onClick={handleSubmit} disabled={submitting}>
            {isEdit
              ? (submitting ? 'Сохранение...' : 'Сохранить')
              : (submitting ? 'Создание...' : 'Создать товар')}
          </Button>
        </div>
      </div>
    </PageContainer>
  );
}
