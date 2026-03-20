'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Select, Textarea, FormField } from '@asko/ui';
import { PageContainer } from '@/components/account/page-container';
import { PageHeader } from '@/components/account/page-header';
import { userApi } from '@/lib/api/user';

interface UserDevice {
  id: string;
  device?: { name?: string; model?: string };
  serialNumber?: string;
}

interface Certificate {
  id: string;
  certificateNumber: string;
  status: string;
  expiresAt: string;
  userDevice?: { id: string };
}

interface RepairRequest {
  id: string;
  status: string;
  userDevice?: { id: string };
}

interface UploadedImage {
  id: string;
  file: File;
  preview: string;
}

const TERMINAL_STATUSES = ['completed', 'cancelled', 'refunded', 'refused'];

export function CreateRequest() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [devices, setDevices] = useState<UserDevice[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [devicesInRepair, setDevicesInRepair] = useState<Set<string>>(new Set());
  const [loadingDevices, setLoadingDevices] = useState(true);

  const [userDeviceId, setUserDeviceId] = useState('');
  const [certificateId, setCertificateId] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<UploadedImage[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        const [devRes, certRes, reqRes] = await Promise.all([
          userApi.getMyDevices(),
          userApi.getMyCertificates(),
          userApi.getMyRequests({ limit: 100 }),
        ]);
        const devList = devRes.data;
        setDevices(devList);

        const certList = certRes.data;
        setCertificates(certList.filter((c) => c.status === 'active'));

        // Determine which devices have active repair requests
        const reqList = reqRes.data.data;
        const activeDeviceIds = new Set<string>();
        for (const req of reqList) {
          if (!TERMINAL_STATUSES.includes(req.status) && req.userDevice?.id) {
            activeDeviceIds.add(req.userDevice.id);
          }
        }
        setDevicesInRepair(activeDeviceIds);
      } catch {
        // silently fail
      } finally {
        setLoadingDevices(false);
      }
    }
    fetchData();
  }, []);

  // Filter certificates by selected device
  const filteredCertificates = certificates.filter(
    (c) => !userDeviceId || c.userDevice?.id === userDeviceId,
  );

  // Reset certificate when device changes
  useEffect(() => {
    setCertificateId('');
  }, [userDeviceId]);

  const handleAddImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newImages: UploadedImage[] = Array.from(files).map((file) => ({
      id: crypto.randomUUID(),
      file,
      preview: URL.createObjectURL(file),
    }));
    setImages((prev) => [...prev, ...newImages]);
    // Reset input so the same file can be selected again
    e.target.value = '';
  };

  const handleRemoveImage = (id: string) => {
    setImages((prev) => {
      const img = prev.find((i) => i.id === id);
      if (img) URL.revokeObjectURL(img.preview);
      return prev.filter((i) => i.id !== id);
    });
  };

  const handleSubmit = async () => {
    setError('');

    if (!userDeviceId) {
      setError('Выберите устройство');
      return;
    }
    if (!description.trim()) {
      setError('Опишите проблему');
      return;
    }

    setSubmitting(true);
    try {
      // 1. Create the repair request
      const { data: request } = await userApi.createRepairRequest({
        userDeviceId,
        description: description.trim(),
        ...(certificateId ? { certificateId } : {}),
      });

      // 2. Upload and attach images
      for (const img of images) {
        try {
          const { data: uploaded } = await userApi.uploadImage(img.file);
          await userApi.attachImage(uploaded.id, 'repair_request', request.id);
        } catch {
          // continue even if single image fails
        }
      }

      // 3. Redirect to the request status page (user pays from there)
      router.push(`/account/requests/${request.id}`);
    } catch (err: any) {
      const status = err?.response?.status;
      const message = err?.response?.data?.message;
      if (status === 409) {
        setError(message || 'Для этого устройства уже существует активная заявка на ремонт');
        // Refresh devices in repair state
        setDevicesInRepair((prev) => new Set([...prev, userDeviceId]));
      } else {
        setError('Ошибка при создании заявки. Попробуйте ещё раз.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader>Создание заявки</PageHeader>

      <div className="flex flex-col gap-6 max-w-[600px]">
        {/* Device select */}
        <FormField label="Устройство" variant="bold">
          {loadingDevices ? (
            <p className="text-sm text-text-sub">Загрузка устройств...</p>
          ) : devices.length === 0 ? (
            <p className="text-sm text-text-sub">
              У вас нет зарегистрированных устройств. Сначала добавьте устройство в разделе
              &laquo;Сертификаты&raquo;.
            </p>
          ) : (
            <Select
              value={userDeviceId}
              onChange={(e) => setUserDeviceId(e.target.value)}
            >
              <option value="" disabled>
                Выберите устройство
              </option>
              {devices.map((d) => {
                const inRepair = devicesInRepair.has(d.id);
                const label = d.device?.name
                  ? `${d.device.name}${d.serialNumber ? ` (${d.serialNumber})` : ''}`
                  : d.serialNumber ?? d.id;
                return (
                  <option key={d.id} value={d.id} disabled={inRepair}>
                    {label}{inRepair ? ' - в ремонте' : ''}
                  </option>
                );
              })}
            </Select>
          )}
        </FormField>

        {/* Certificate select */}
        {filteredCertificates.length > 0 && (
          <FormField label="Сертификат (необязательно)" variant="bold">
            <Select
              value={certificateId}
              onChange={(e) => setCertificateId(e.target.value)}
            >
              <option value="">Без сертификата</option>
              {filteredCertificates.map((c) => (
                <option key={c.id} value={c.id}>
                  №{c.certificateNumber}
                </option>
              ))}
            </Select>
          </FormField>
        )}

        {/* Problem description */}
        <FormField label="Описание проблемы" variant="bold">
          <Textarea
            placeholder="Опишите неисправность или проблему с устройством..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
          />
        </FormField>

        {/* Image upload */}
        <FormField label="Фотографии (необязательно)" variant="bold">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={handleAddImages}
            className="hidden"
          />

          {/* Image preview grid */}
          {images.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {images.map((img) => (
                <div key={img.id} className="relative w-24 h-24 rounded-sm overflow-hidden border border-border-light">
                  <img
                    src={img.preview}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(img.id)}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center text-xs leading-none cursor-pointer"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-text-main border border-dashed border-border-light rounded-sm hover:border-text-sub transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Добавить фото
          </button>
        </FormField>

        {/* Error message */}
        {error && <p className="text-sm text-brand-red">{error}</p>}

        {/* Submit */}
        <Button
          variant="primary"
          size="lg"
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full lg:w-fit"
        >
          {submitting ? 'Отправка...' : 'Отправить заявку'}
        </Button>
      </div>
    </PageContainer>
  );
}
