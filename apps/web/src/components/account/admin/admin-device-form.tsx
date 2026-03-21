'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button, Modal, Input, Select, Textarea, FormField } from '@asko/ui';
import { PageContainer } from '@/components/account/page-container';
import { PageHeader } from '@/components/account/page-header';
import { adminApi } from '@/lib/api/admin';
import type { DeviceType } from '@asko/shared/client';

interface KVPair {
  key: string;
  value: string;
}

function KeyValueEditor({
  pairs,
  onChange,
}: {
  pairs: KVPair[];
  onChange: (pairs: KVPair[]) => void;
}) {
  const updatePair = (index: number, field: 'key' | 'value', val: string) => {
    const next = pairs.map((p, i) => (i === index ? { ...p, [field]: val } : p));
    onChange(next);
  };

  const removePair = (index: number) => {
    onChange(pairs.filter((_, i) => i !== index));
  };

  const addPair = () => {
    onChange([...pairs, { key: '', value: '' }]);
  };

  return (
    <div className="flex flex-col gap-2 max-w-[500px]">
      {pairs.map((pair, i) => (
        <div key={i} className="flex gap-2 items-center">
          <Input
            type="text"
            placeholder="Ключ"
            value={pair.key}
            onChange={(e) => updatePair(i, 'key', e.target.value)}
            className="flex-1"
          />
          <Input
            type="text"
            placeholder="Значение"
            value={pair.value}
            onChange={(e) => updatePair(i, 'value', e.target.value)}
            className="flex-1"
          />
          <Button variant="danger" size="sm" onClick={() => removePair(i)}>
            &times;
          </Button>
        </div>
      ))}
      <Button variant="secondary" size="sm" onClick={addPair} className="self-start">
        + Добавить
      </Button>
    </div>
  );
}

function kvToRecord(pairs: KVPair[]): Record<string, string> | undefined {
  const filtered = pairs.filter((p) => p.key.trim());
  if (filtered.length === 0) return undefined;
  const obj: Record<string, string> = {};
  for (const p of filtered) {
    obj[p.key.trim()] = p.value;
  }
  return obj;
}

function recordToKV(obj?: Record<string, any> | null): KVPair[] {
  if (!obj || typeof obj !== 'object') return [];
  return Object.entries(obj).map(([key, value]) => ({
    key,
    value: String(value ?? ''),
  }));
}

interface DeviceImage {
  id: string;
  image: {
    original: { secure_url: string };
    thumbnail?: { secure_url: string };
  };
  order: number;
}

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const CROP_CONTAINER = 420;
const CROP_OUTPUT_W = 800;
const CROP_OUTPUT_H = 600;
const MIN_SCALE = 0.2;
const MAX_SCALE = 4;

function ImageCropModal({
  imageSrc,
  onConfirm,
  onCancel,
}: {
  imageSrc: string;
  onConfirm: (blob: Blob) => void;
  onCancel: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const [imgNatural, setImgNatural] = useState({ w: 0, h: 0 });
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const cropW = 360;
  const cropH = 270;

  const dragging = useRef(false);
  const lastPointer = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const img = new window.Image();
    img.onload = () => {
      imgRef.current = img;
      setImgNatural({ w: img.naturalWidth, h: img.naturalHeight });
      const fitScale = Math.max(cropW / img.naturalWidth, cropH / img.naturalHeight);
      setScale(fitScale);
      setOffset({ x: 0, y: 0 });
    };
    img.src = imageSrc;
  }, [imageSrc]);

  const clampOffset = useCallback(
    (ox: number, oy: number, s: number) => {
      if (!imgNatural.w) return { x: ox, y: oy };
      const maxX = (imgNatural.w * s) / 2 - cropW / 2;
      const maxY = (imgNatural.h * s) / 2 - cropH / 2;
      return {
        x: Math.max(-Math.max(0, maxX), Math.min(Math.max(0, maxX), ox)),
        y: Math.max(-Math.max(0, maxY), Math.min(Math.max(0, maxY), oy)),
      };
    },
    [imgNatural],
  );

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragging.current = true;
    lastPointer.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    const dx = e.clientX - lastPointer.current.x;
    const dy = e.clientY - lastPointer.current.y;
    lastPointer.current = { x: e.clientX, y: e.clientY };
    setOffset((prev) => clampOffset(prev.x + dx, prev.y + dy, scale));
  };

  const handlePointerUp = () => {
    dragging.current = false;
  };

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();
      setScale((prev) => {
        const next = Math.max(MIN_SCALE, Math.min(MAX_SCALE, prev - e.deltaY * 0.001));
        setOffset((o) => clampOffset(o.x, o.y, next));
        return next;
      });
    },
    [clampOffset],
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  const handleConfirm = () => {
    const img = imgRef.current;
    if (!img) return;

    const canvas = document.createElement('canvas');
    canvas.width = CROP_OUTPUT_W;
    canvas.height = CROP_OUTPUT_H;
    const ctx = canvas.getContext('2d')!;

    const srcCenterX = img.naturalWidth / 2 - offset.x / scale;
    const srcCenterY = img.naturalHeight / 2 - offset.y / scale;
    const srcW = cropW / scale;
    const srcH = cropH / scale;

    ctx.drawImage(
      img,
      srcCenterX - srcW / 2,
      srcCenterY - srcH / 2,
      srcW,
      srcH,
      0,
      0,
      CROP_OUTPUT_W,
      CROP_OUTPUT_H,
    );

    canvas.toBlob(
      (blob) => {
        if (blob) onConfirm(blob);
      },
      'image/jpeg',
      0.92,
    );
  };

  if (!imgNatural.w) return null;

  return (
    <Modal open onClose={onCancel} className="flex flex-col items-center gap-4 p-6 w-[480px] max-w-[95vw]">
      <h3 className="text-base font-medium text-text-main">Обрезка изображения</h3>

      <div
        ref={containerRef}
        className="relative select-none touch-none overflow-hidden rounded-sm bg-black/20"
        style={{ width: CROP_CONTAINER, height: CROP_CONTAINER * (cropH / cropW), cursor: 'grab' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <img
          src={imageSrc}
          alt=""
          draggable={false}
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: imgNatural.w * scale,
            height: imgNatural.h * scale,
            transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
            pointerEvents: 'none',
            maxWidth: 'none',
          }}
        />

        <svg
          className="absolute inset-0 pointer-events-none"
          width={CROP_CONTAINER}
          height={CROP_CONTAINER * (cropH / cropW)}
          viewBox={`0 0 ${CROP_CONTAINER} ${CROP_CONTAINER * (cropH / cropW)}`}
        >
          <defs>
            <mask id="crop-rect-mask">
              <rect width={CROP_CONTAINER} height={CROP_CONTAINER * (cropH / cropW)} fill="white" />
              <rect
                x={(CROP_CONTAINER - cropW) / 2}
                y={(CROP_CONTAINER * (cropH / cropW) - cropH) / 2}
                width={cropW}
                height={cropH}
                fill="black"
              />
            </mask>
          </defs>
          <rect
            width={CROP_CONTAINER}
            height={CROP_CONTAINER * (cropH / cropW)}
            fill="rgba(0,0,0,0.55)"
            mask="url(#crop-rect-mask)"
          />
          <rect
            x={(CROP_CONTAINER - cropW) / 2}
            y={(CROP_CONTAINER * (cropH / cropW) - cropH) / 2}
            width={cropW}
            height={cropH}
            fill="none"
            stroke="white"
            strokeWidth={1.5}
            strokeDasharray="4 3"
            opacity={0.7}
          />
        </svg>
      </div>

      <p className="text-xs text-text-sub text-center">
        Перетащите для перемещения, прокрутите для масштабирования
      </p>

      <div className="flex gap-4 w-full">
        <Button variant="secondary" onClick={onCancel} fullWidth>
          Отмена
        </Button>
        <Button onClick={handleConfirm} fullWidth>
          Сохранить
        </Button>
      </div>
    </Modal>
  );
}

function DeviceImages({ deviceId }: { deviceId: string }) {
  const [images, setImages] = useState<DeviceImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const dragItem = useRef<number | null>(null);
  const dragOver = useRef<number | null>(null);

  const fetchImages = async () => {
    try {
      const { data } = await adminApi.getDeviceImages(deviceId);
      setImages(data);
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
                src={img.image.thumbnail?.secure_url ?? img.image.original.secure_url}
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
        <ImageCropModal
          imageSrc={cropSrc}
          onConfirm={handleCropConfirm}
          onCancel={handleCropCancel}
        />
      )}
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
