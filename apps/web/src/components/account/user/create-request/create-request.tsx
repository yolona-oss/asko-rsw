'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Select, Textarea, FormField, Input } from '@asko/ui';
import { Plus } from 'lucide-react';
import { PageContainer } from '@/components/account/page-container';
import { PageHeader } from '@/components/account/page-header';
import { repairRequestApi } from '@/lib/api/repair-request';
import { userDeviceApi } from '@/lib/api/user-device';
import { certificateApi } from '@/lib/api/certificate';
import { deviceApi } from '@/lib/api/device';
import { fileUploadApi } from '@/lib/api/file-upload';
import { AddDeviceForm } from '@/components/account/user/certificates/add-device-form';
import { AddCertificateForm } from '@/components/account/user/certificates/add-certificate-form';
import { TERMINAL_STATUSES } from './constants';
import type { UserDevice, Certificate, UploadedImage } from './types';

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

  const [deviceParts, setDeviceParts] = useState<any[]>([]);
  const [selectedParts, setSelectedParts] = useState<{ devicePartId?: string; name: string }[]>([]);
  const [customPartName, setCustomPartName] = useState('');
  const [showCustomPartInput, setShowCustomPartInput] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showAddDevice, setShowAddDevice] = useState(false);
  const [showAddCert, setShowAddCert] = useState(false);

  const fetchData = async () => {
    setLoadingDevices(true);
    try {
      const [devRes, certRes, reqRes] = await Promise.all([
        userDeviceApi.getMy(),
        certificateApi.getMy(),
        repairRequestApi.getMy({ limit: 100 }),
      ]);
      setDevices(devRes.data);
      setCertificates(certRes.data.filter((c) => c.status === 'active'));

      const reqList = reqRes.data.data ?? [];
      const activeDeviceIds = new Set<string>();
      for (const req of reqList) {
        if (!TERMINAL_STATUSES.includes(req.status) && req.userDevice?.id) {
          activeDeviceIds.add(req.userDevice.id);
        }
      }
      setDevicesInRepair(activeDeviceIds);
    } catch {
    } finally {
      setLoadingDevices(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Filter certificates by selected device
  const filteredCertificates = certificates.filter(
    (c) => !userDeviceId || c.userDevice?.id === userDeviceId,
  );

  // Reset certificate and broken parts when device changes
  useEffect(() => {
    setCertificateId('');
    setSelectedParts([]);
    setDeviceParts([]);
    setCustomPartName('');
    setShowCustomPartInput(false);
  }, [userDeviceId]);

  // Fetch device parts catalog when device changes
  useEffect(() => {
    if (!userDeviceId) return;
    const selectedDevice = devices.find((d) => d.id === userDeviceId);
    const deviceId = selectedDevice?.device?.id;
    if (!deviceId) return;

    let cancelled = false;
    deviceApi.getParts(deviceId).then((res) => {
      if (!cancelled) {
        setDeviceParts(res.data?.parts ?? []);
      }
    }).catch(() => {
      if (!cancelled) setDeviceParts([]);
    });

    return () => { cancelled = true; };
  }, [userDeviceId, devices]);

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

    const selectedDev = devices.find((d) => d.id === userDeviceId);
    const addrValidation = selectedDev?.address?.validationStatus;
    if (addrValidation === 'pending') {
      setError('Адрес устройства ещё проходит проверку. Попробуйте через несколько секунд.');
      return;
    }
    if (addrValidation === 'invalid' || addrValidation === 'error') {
      setError('Адрес устройства не прошёл проверку. Обновите адрес в разделе «Сертификаты».');
      return;
    }

    if (!description.trim()) {
      setError('Опишите проблему');
      return;
    }

    setSubmitting(true);
    try {
      // TODO add modal with view progress(stages and stages steps)
      // 1. Create the repair request
      const brokenParts = selectedParts.map((sp) => ({
        ...(sp.devicePartId ? { devicePartId: sp.devicePartId } : {}),
        name: sp.name,
      }));
      const { data } = await repairRequestApi.create({
        userDeviceId,
        description: description.trim(),
        ...(certificateId ? { certificateId } : {}),
        ...(brokenParts.length > 0 ? { brokenParts } : {}),
      });
      const request = data.request;

      // 2. Upload images directly to repair request
      for (const img of images) {
        try {
          await fileUploadApi.uploadRepairRequestImage(img.file, request.id);
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
            <div className="flex flex-col gap-3">
              <p className="text-sm text-text-sub">
                У вас нет зарегистрированных устройств. Добавьте устройство и при необходимости зарегистрируйте сертификат.
              </p>
              <div className="flex gap-2">
                <Button variant="primary" size="sm" onClick={() => setShowAddDevice(true)}>
                  Добавить устройство
                </Button>
                <Button variant="secondary" size="sm" onClick={() => setShowAddCert(true)}>
                  Добавить сертификат
                </Button>
              </div>
            </div>
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
                const addrStatus = d.address?.validationStatus;
                const addrInvalid = addrStatus === 'invalid' || addrStatus === 'error';
                const addrPending = addrStatus === 'pending';
                const isDisabled = inRepair || addrInvalid;
                const label = d.device?.name
                  ? `${d.device.name}${d.serialNumber ? ` (${d.serialNumber})` : ''}`
                  : d.serialNumber ?? d.id;
                const suffix = inRepair
                  ? ' — в ремонте'
                  : addrInvalid
                    ? ' — адрес не подтверждён'
                    : addrPending
                      ? ' — проверка адреса...'
                      : '';
                return (
                  <option key={d.id} value={d.id} disabled={isDisabled}>
                    {label}{suffix}
                  </option>
                );
              })}
            </Select>
          )}
        </FormField>

        {/* Address validation warning */}
        {userDeviceId && (() => {
          const sel = devices.find((d) => d.id === userDeviceId);
          const vs = sel?.address?.validationStatus;
          if (vs === 'pending') return (
            <div className="px-4 py-3 bg-yellow-50 border border-yellow-200 text-sm text-yellow-800">
              Адрес устройства проходит проверку. Отправка заявки будет доступна после подтверждения.
            </div>
          );
          if (vs === 'invalid' || vs === 'error') return (
            <div className="px-4 py-3 bg-red-50 border border-red-200 text-sm text-red-800">
              Адрес устройства не прошёл проверку{sel?.address?.validationError ? `: ${sel.address.validationError}` : ''}. Обновите адрес в разделе «Сертификаты».
            </div>
          );
          return null;
        })()}

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

        {/* Broken parts selection */}
        {userDeviceId && (
          <FormField label="Неисправные запчасти (необязательно)" variant="bold">
            {/* Catalog parts checkboxes */}
            {deviceParts.length > 0 && (
              <div className="flex flex-col gap-2">
                {deviceParts.map((part) => {
                  const isChecked = selectedParts.some((sp) => sp.devicePartId === part.id);
                  const label = part.partNumber
                    ? `${part.name} (${part.partNumber})`
                    : part.name;
                  return (
                    <label key={part.id} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          if (isChecked) {
                            setSelectedParts((prev) => prev.filter((sp) => sp.devicePartId !== part.id));
                          } else {
                            setSelectedParts((prev) => [...prev, { devicePartId: part.id, name: part.name }]);
                          }
                        }}
                        className="w-4 h-4 accent-brand-main"
                      />
                      <span className="text-text-main">{label}</span>
                    </label>
                  );
                })}
              </div>
            )}

            {/* Custom parts chips */}
            {selectedParts.filter((sp) => !sp.devicePartId).length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedParts
                  .filter((sp) => !sp.devicePartId)
                  .map((sp, idx) => (
                    <span
                      key={`custom-${idx}`}
                      className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-bg-alt border border-border-light"
                    >
                      {sp.name}
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedParts((prev) =>
                            prev.filter((p) => !(p.name === sp.name && !p.devicePartId)),
                          )
                        }
                        className="ml-1 text-text-sub hover:text-text-main cursor-pointer"
                      >
                        &times;
                      </button>
                    </span>
                  ))}
              </div>
            )}

            {/* Add custom part */}
            {showCustomPartInput ? (
              <div className="flex items-center gap-2 mt-2">
                <Input
                  placeholder="Название запчасти"
                  value={customPartName}
                  onChange={(e) => setCustomPartName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const trimmed = customPartName.trim();
                      if (trimmed) {
                        setSelectedParts((prev) => [...prev, { name: trimmed }]);
                        setCustomPartName('');
                      }
                    }
                  }}
                  className="flex-1"
                />
                <button
                  type="button"
                  onClick={() => {
                    const trimmed = customPartName.trim();
                    if (trimmed) {
                      setSelectedParts((prev) => [...prev, { name: trimmed }]);
                      setCustomPartName('');
                    }
                  }}
                  className="flex items-center justify-center w-9 h-9 text-lg font-medium border border-border-light hover:border-text-sub transition-colors cursor-pointer"
                >
                  +
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowCustomPartInput(true)}
                className="flex items-center gap-2 mt-2 text-sm font-medium text-text-sub hover:text-text-main transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Добавить свою запчасть
              </button>
            )}
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
                <div key={img.id} className="relative w-24 h-24 overflow-hidden border border-border-light">
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
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-text-main border border-dashed border-border-light hover:border-text-sub transition-colors cursor-pointer"
          >
            <Plus className="w-5 h-5" />
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

      <AddDeviceForm
        open={showAddDevice}
        onClose={() => setShowAddDevice(false)}
        onSuccess={() => { setShowAddDevice(false); fetchData(); }}
      />

      <AddCertificateForm
        open={showAddCert}
        onClose={() => setShowAddCert(false)}
        onSuccess={() => { setShowAddCert(false); fetchData(); }}
        onOpenAddDevice={() => setShowAddDevice(true)}
      />
    </PageContainer>
  );
}
