'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input, Select, Textarea, FormField, KeyValueEditor, kvToRecord, recordToKV, SkeletonCard } from '@asko/ui';
import type { KVPair } from '@asko/ui';
import { PageContainer } from '@/components/account/layout/page-container';
import { PageHeader } from '@/components/account/layout/page-header';
import { useFormGuard } from '@/hooks/use-form-guard';
import { EditedMark } from '@/components/shared/edited-mark';
import { deviceApi } from '@/lib/api/device';
import { useDeviceCategories } from '@/hooks/use-device-categories';
import type { FormData, AdminDeviceFormProps } from './types';
import { INITIAL_DATA } from './constants';
import { DeviceImages } from './device-images';
import { DeviceParts } from './device-parts';

type DeviceSnapshot = FormData & { specifications: KVPair[]; features: KVPair[] };

export function AdminDeviceForm({ deviceId }: AdminDeviceFormProps) {
  const router = useRouter();
  const [data, setData] = useState<FormData>(INITIAL_DATA);
  const [specifications, setSpecifications] = useState<KVPair[]>([]);
  const [features, setFeatures] = useState<KVPair[]>([]);
  const [loading, setLoading] = useState(!!deviceId);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const isEdit = !!deviceId;
  const { data: categories } = useDeviceCategories();

  const [initialState, setInitialState] = useState<DeviceSnapshot | undefined>(undefined);

  const formState = useMemo<DeviceSnapshot>(
    () => ({ ...data, specifications, features }),
    [data, specifications, features],
  );

  useEffect(() => {
    if (!deviceId) {
      setInitialState({ ...INITIAL_DATA, specifications: [], features: [] });
      return;
    }
    deviceApi
      .getOne(deviceId)
      .then(({ data: device }) => {
        const d: FormData = {
          name: device.name ?? '',
          type: device.type ?? '',
          model: device.model ?? '',
          brand: device.brand ?? '',
          description: device.description ?? '',
          slug: device.slug ?? '',
          isFeatured: device.isFeatured ?? false,
        };
        const specs = recordToKV(device.specifications);
        const feats = recordToKV(device.features);
        setData(d);
        setSpecifications(specs);
        setFeatures(feats);
        setInitialState({ ...d, specifications: specs, features: feats });
      })
      .catch(() => setError('Не удалось загрузить товар'))
      .finally(() => setLoading(false));
  }, [deviceId]);

  const update = (partial: Partial<FormData>) => {
    setData((prev) => ({ ...prev, ...partial }));
  };

  const handleApplyDraft = useCallback((draft: DeviceSnapshot) => {
    const { specifications: specs, features: feats, ...formData } = draft;
    setData(formData);
    setSpecifications(specs);
    setFeatures(feats);
  }, []);

  const saveDevice = useCallback(async () => {
    setError('');
    const payload = {
      name: data.name,
      type: data.type,
      model: data.model,
      brand: data.brand,
      description: data.description || undefined,
      specifications: kvToRecord(specifications),
      features: kvToRecord(features),
      slug: data.slug || Math.random().toString(36).substring(2, 2 + 10),
      isFeatured: data.isFeatured,
    };
    if (isEdit) {
      await deviceApi.update(deviceId!, payload);
    } else {
      await deviceApi.create(payload);
    }
  }, [data, specifications, features, isEdit, deviceId]);

  const guard = useFormGuard<DeviceSnapshot>({
    storageKey: `device-${deviceId || 'new'}`,
    currentState: formState,
    initialState,
    onSave: saveDevice,
    onApplyDraft: handleApplyDraft,
    fieldLabels: {
      name: 'Название',
      type: 'Тип товара',
      model: 'Модель',
      brand: 'Бренд',
      description: 'Описание',
      slug: 'Slug (URL)',
      isFeatured: 'На главной',
      specifications: 'Спецификации',
      features: 'Характеристики',
    },
  });

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await saveDevice();
      guard.markSaved();
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
        <SkeletonCard className="h-[400px]" />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader>
        <span className="flex items-center gap-3">
          {isEdit ? 'Редактирование товара' : 'Новый товар'}
          <EditedMark visible={guard.dirty} />
        </span>
      </PageHeader>

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
            {(categories ?? []).map((cat) => (
              <option key={cat.name} value={cat.name}>{cat.label}</option>
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

        <label className="flex items-center gap-3 cursor-pointer select-none">
          <button
            type="button"
            role="switch"
            aria-checked={data.isFeatured}
            onClick={() => update({ isFeatured: !data.isFeatured })}
            className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors ${
              data.isFeatured ? 'bg-brand-red-dark' : 'bg-border-light'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-surface shadow-sm transform transition-transform mt-0.5 ${
                data.isFeatured ? 'translate-x-[22px]' : 'translate-x-0.5'
              }`}
            />
          </button>
          <span className="text-sm font-bold text-text-main">Показывать на главной</span>
        </label>

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
          <Button variant="secondary" onClick={() => guard.guardedNavigate('/account/devices')}>
            Отмена
          </Button>
          <Button variant="primary" size="lg" onClick={handleSubmit} disabled={submitting}>
            {isEdit
              ? (submitting ? 'Сохранение...' : 'Сохранить')
              : (submitting ? 'Создание...' : 'Создать товар')}
          </Button>
        </div>
      </div>

      {guard.guardDialog}
      {guard.draftDialog}
    </PageContainer>
  );
}
