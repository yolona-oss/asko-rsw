'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button, Input, Select, Textarea, FormField, KeyValueEditor, kvToRecord, recordToKV, CropModal } from '@asko/ui';
import type { KVPair } from '@asko/ui';
import { PageContainer } from '@/components/account/page-container';
import { PageHeader } from '@/components/account/page-header';
import { adminApi } from '@/lib/api/admin';
import type { DeviceType, IImageAttachment } from '@asko/shared/client';

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

function DeviceImages({ deviceId }: { deviceId: string }) {
  const [images, setImages] = useState<IImageAttachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const dragItem = useRef<number | null>(null);
  const dragOver = useRef<number | null>(null);

  const fetchImages = async () => {
    try {
      const { data } = await adminApi.getDeviceImages(deviceId);
      setImages(data.images);
    } catch {
      // silently fail
    }
  };

  useEffect(() => {
    fetchImages();
  }, [deviceId]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setError('Допустимые форматы: JPG, PNG, WebP');
      if (fileRef.current) fileRef.current.value = '';
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setError('Максимальный размер файла: 10 МБ');
      if (fileRef.current) fileRef.current.value = '';
      return;
    }

    setError('');
    const url = URL.createObjectURL(file);
    setCropSrc(url);
  };

  const handleCropConfirm = async (blob: Blob) => {
    setCropSrc(null);
    if (fileRef.current) fileRef.current.value = '';
    setUploading(true);
    try {
      const file = new File([blob], 'image.webp', { type: 'image/jpeg' });
      await adminApi.uploadDeviceImage(deviceId, file);
      await fetchImages();
    } catch {
      setError('Ошибка загрузки изображения');
    } finally {
      setUploading(false);
    }
  };

  const handleCropCancel = () => {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleDelete = async (imageId: string) => {
    try {
      await adminApi.deleteDeviceImage(deviceId, imageId);
      setImages((prev) => prev.filter((img) => img.id !== imageId));
    } catch {
      setError('Ошибка удаления изображения');
    }
  };

  const handleDragStart = (index: number) => {
    dragItem.current = index;
  };

  const handleDragEnter = (index: number) => {
    dragOver.current = index;
  };

  const handleDragEnd = async () => {
    if (dragItem.current === null || dragOver.current === null || dragItem.current === dragOver.current) {
      dragItem.current = null;
      dragOver.current = null;
      return;
    }

    const reordered = [...images];
    const [moved] = reordered.splice(dragItem.current, 1);
    reordered.splice(dragOver.current, 0, moved);

    dragItem.current = null;
    dragOver.current = null;

    setImages(reordered);

    try {
      await adminApi.reorderDeviceImages(deviceId, reordered.map((img) => img.id));
    } catch {
      await fetchImages();
    }
  };

  return (
    <div className="flex flex-col gap-3 max-w-[500px]">
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {images.map((img, i) => (
            <div
              key={img.id}
              draggable
              onDragStart={() => handleDragStart(i)}
              onDragEnter={() => handleDragEnter(i)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => e.preventDefault()}
              className="relative group border border-gray-200 rounded-sm overflow-hidden cursor-grab active:cursor-grabbing"
            >
              <Image
                src={img.imageJson.thumbnail?.secure_url ?? img.imageJson.original.secure_url}
                alt=""
                width={150}
                height={150}
                className="w-full h-auto object-cover aspect-square pointer-events-none"
              />
              <div className="absolute top-1 left-1 w-5 h-5 bg-black/50 text-white rounded-full text-[10px] flex items-center justify-center">
                {i + 1}
              </div>
              <button
                type="button"
                onClick={() => handleDelete(img.id)}
                className="absolute top-1 right-1 w-6 h-6 bg-red-600 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept=".webp,.webp,.webp,.webp"
        className="hidden"
        onChange={handleFileSelect}
      />
      <Button
        variant="secondary"
        size="sm"
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        className="self-start"
      >
        {uploading ? 'Загрузка...' : '+ Загрузить изображение'}
      </Button>
      {error && <p className="text-xs text-brand-red">{error}</p>}

      {cropSrc && (
        <CropModal
          imageSrc={cropSrc}
          onConfirm={handleCropConfirm}
          onCancel={handleCropCancel}
          shape="rectangle"
          outputWidth={800}
          outputHeight={600}
          cropWidth={360}
          cropHeight={270}
        />
      )}
    </div>
  );
}

interface DevicePart {
  id: string;
  name: string;
  partNumber?: string;
  price?: number;
  description?: string;
}

interface PartFormData {
  name: string;
  partNumber: string;
  price: string;
  description: string;
}

const EMPTY_PART_FORM: PartFormData = {
  name: '',
  partNumber: '',
  price: '',
  description: '',
};

function DeviceParts({ deviceId }: { deviceId: string }) {
  const [parts, setParts] = useState<DevicePart[]>([]);
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PartFormData>(EMPTY_PART_FORM);
  const [submitting, setSubmitting] = useState(false);

  const fetchParts = async () => {
    try {
      const { data } = await adminApi.getDeviceParts(deviceId);
      setParts(data.parts ?? []);
    } catch {
      // silently fail
    }
  };

  useEffect(() => {
    fetchParts();
  }, [deviceId]);

  const updateForm = (partial: Partial<PartFormData>) => {
    setForm((prev) => ({ ...prev, ...partial }));
  };

  const resetForm = () => {
    setForm(EMPTY_PART_FORM);
    setAdding(false);
    setEditingId(null);
  };

  const handleCreate = async () => {
    if (!form.name.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      await adminApi.createDevicePart(deviceId, {
        name: form.name.trim(),
        partNumber: form.partNumber.trim() || undefined,
        price: form.price ? Number(form.price) : undefined,
        description: form.description.trim() || undefined,
      });
      resetForm();
      await fetchParts();
    } catch {
      setError('Ошибка при добавлении запчасти');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (partId: string) => {
    if (!form.name.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      await adminApi.updateDevicePart(deviceId, partId, {
        name: form.name.trim(),
        partNumber: form.partNumber.trim() || undefined,
        price: form.price ? Number(form.price) : undefined,
        description: form.description.trim() || undefined,
      });
      resetForm();
      await fetchParts();
    } catch {
      setError('Ошибка при обновлении запчасти');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (partId: string) => {
    setError('');
    try {
      await adminApi.deleteDevicePart(deviceId, partId);
      setParts((prev) => prev.filter((p) => p.id !== partId));
      if (editingId === partId) resetForm();
    } catch {
      setError('Ошибка при удалении запчасти');
    }
  };

  const startEdit = (part: DevicePart) => {
    setAdding(false);
    setEditingId(part.id);
    setForm({
      name: part.name ?? '',
      partNumber: part.partNumber ?? '',
      price: part.price != null ? String(part.price) : '',
      description: part.description ?? '',
    });
  };

  const startAdd = () => {
    setEditingId(null);
    setAdding(true);
    setForm(EMPTY_PART_FORM);
  };

  const partFormFields = (
    <div className="flex flex-col gap-2 max-w-[500px]">
      <FormField label="Название">
        <Input
          type="text"
          placeholder="Название запчасти..."
          value={form.name}
          onChange={(e) => updateForm({ name: e.target.value })}
        />
      </FormField>
      <FormField label="Артикул">
        <Input
          type="text"
          placeholder="Артикул..."
          value={form.partNumber}
          onChange={(e) => updateForm({ partNumber: e.target.value })}
        />
      </FormField>
      <FormField label="Цена">
        <Input
          type="number"
          placeholder="Цена в рублях..."
          value={form.price}
          onChange={(e) => updateForm({ price: e.target.value })}
        />
      </FormField>
      <FormField label="Описание">
        <Input
          type="text"
          placeholder="Описание..."
          value={form.description}
          onChange={(e) => updateForm({ description: e.target.value })}
        />
      </FormField>
    </div>
  );

  return (
    <div className="flex flex-col gap-3 max-w-[500px]">
      {parts.length > 0 && (
        <div className="flex flex-col gap-2">
          {parts.map((part) => (
            <div key={part.id}>
              {editingId === part.id ? (
                <div className="border border-gray-200 rounded-sm p-3 flex flex-col gap-3">
                  {partFormFields}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleUpdate(part.id)}
                      disabled={submitting || !form.name.trim()}
                    >
                      {submitting ? 'Сохранение...' : 'Сохранить'}
                    </Button>
                    <Button variant="secondary" size="sm" onClick={resetForm}>
                      Отмена
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="border border-gray-200 rounded-sm p-3 flex items-start justify-between gap-3">
                  <div className="flex flex-col gap-0.5 text-sm min-w-0">
                    <span className="font-medium">{part.name}</span>
                    {part.partNumber && (
                      <span className="text-text-sub text-xs">Артикул: {part.partNumber}</span>
                    )}
                    {part.price != null && (
                      <span className="text-text-sub text-xs">{part.price} &#8381;</span>
                    )}
                    {part.description && (
                      <span className="text-text-sub text-xs">{part.description}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="secondary" size="sm" onClick={() => startEdit(part)}>
                      Изменить
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => handleDelete(part.id)}>
                      Удалить
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {adding && (
        <div className="border border-gray-200 rounded-sm p-3 flex flex-col gap-3">
          {partFormFields}
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={handleCreate}
              disabled={submitting || !form.name.trim()}
            >
              {submitting ? 'Сохранение...' : 'Сохранить'}
            </Button>
            <Button variant="secondary" size="sm" onClick={resetForm}>
              Отмена
            </Button>
          </div>
        </div>
      )}

      {!adding && !editingId && (
        <Button variant="secondary" size="sm" onClick={startAdd} className="self-start">
          + Добавить запчасть
        </Button>
      )}

      {error && <p className="text-xs text-brand-red">{error}</p>}
    </div>
  );
}

interface FormData {
  name: string;
  type: string;
  model: string;
  brand: string;
  description: string;
  slug: string;
}

const INITIAL_DATA: FormData = {
  name: '',
  type: '',
  model: '',
  brand: 'ASKO',
  description: '',
  slug: '',
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

interface AdminDeviceFormProps {
  deviceId?: string;
}

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
    adminApi
      .getDevice(deviceId)
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
        await adminApi.updateDevice(deviceId, payload);
      } else {
        await adminApi.createDevice(payload);
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
