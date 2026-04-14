'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button, ListSelect, Textarea, FormField } from '@asko/ui';
import type { ListSelectOption } from '@asko/ui';
import { Plus } from 'lucide-react';
import { PageContainer } from '@/components/account/layout/page-container';
import { PageHeader } from '@/components/account/layout/page-header';
import { repairRequestApi } from '@/lib/api/repair-request';
import { userDeviceApi } from '@/lib/api/user-device';
import { certificateApi } from '@/lib/api/certificate';
import { deviceApi } from '@/lib/api/device';
import { fileUploadApi } from '@/lib/api/file-upload';
import { AddDeviceForm } from '@/components/account/certificates/user/add-device-form';
import { PaymentModal } from '@/components/account/payments/user/payment-modal';
import {
  BrokenPartsDraftEditor,
  type DraftBrokenPart,
  type CatalogPart,
} from '@/components/account/requests/shared/broken-parts-draft-editor';
import { CreateCertificateModal } from './create-certificate-modal';
import { TERMINAL_STATUSES } from './constants';
import type { UserDevice, Certificate, UploadedImage } from './types';

type AppliedCert = { cert: Certificate; list: Certificate[] } | null;

/**
 * Pick which cert to auto-apply for a given device and which ones to show in the list.
 * Rules:
 *  - ACTIVE certs always win over PENDING_PAYMENT over EXPIRED.
 *  - If there's an ACTIVE cert: apply the most recent; list all visible (active + expired),
 *    with the dedup rule "1 active + >1 expired → hide expired".
 *  - If no ACTIVE cert but a PENDING_PAYMENT exists: apply the most recent pending one
 *    (user will see pay button, request can still be submitted — backend will flag it
 *    and the cert payment webhook will flip the flag later).
 *  - If nothing: return null so the form shows the "create certificate" button.
 */
function computeAppliedCert(certs: Certificate[], userDeviceId: string): AppliedCert {
  if (!userDeviceId) return null;
  const forDevice = certs.filter((c) => c.userDevice?.id === userDeviceId);
  if (forDevice.length === 0) return null;

  const active = forDevice.filter((c) => c.status === 'active');
  const pending = forDevice.filter((c) => c.status === 'pending_payment');
  const expired = forDevice.filter((c) => c.status === 'expired');

  const byIssuedDesc = (a: Certificate, b: Certificate) =>
    new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime();

  if (active.length > 0) {
    const applied = [...active].sort(byIssuedDesc)[0];
    const list = active.length === 1 && expired.length > 1
      ? active
      : [...active, ...expired];
    return { cert: applied, list };
  }

  if (pending.length > 0) {
    const applied = [...pending].sort(byIssuedDesc)[0];
    return { cert: applied, list: [applied] };
  }

  return null;
}

function formatDateRu(d: Date | string) {
  return new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function CreateRequest() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [devices, setDevices] = useState<UserDevice[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [devicesInRepair, setDevicesInRepair] = useState<Set<string>>(new Set());
  const [loadingDevices, setLoadingDevices] = useState(true);

  const [userDeviceId, setUserDeviceId] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<UploadedImage[]>([]);

  const [deviceParts, setDeviceParts] = useState<CatalogPart[]>([]);
  const [selectedParts, setSelectedParts] = useState<DraftBrokenPart[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showAddDevice, setShowAddDevice] = useState(false);
  const [showCreateCert, setShowCreateCert] = useState(false);
  const [localCert, setLocalCert] = useState<Certificate | null>(null);
  const [showPayment, setShowPayment] = useState(false);

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

  // Auto-apply cert for the selected device. Prefer a just-created localCert
  // (which may still be PENDING_PAYMENT) so the user sees the cert they just made.
  const applied: AppliedCert =
    localCert && localCert.userDevice?.id === userDeviceId
      ? { cert: localCert, list: [localCert] }
      : computeAppliedCert(certificates, userDeviceId);

  const deviceOptions: ListSelectOption[] = useMemo(
    () =>
      devices.map((d) => {
        const inRepair = devicesInRepair.has(d.id);
        const addrStatus = d.address?.validationStatus;
        const addrInvalid = addrStatus === 'invalid' || addrStatus === 'error';
        const addrPending = addrStatus === 'pending';

        const label = d.device?.name
          ? `${d.device.name}${d.serialNumber ? ` (${d.serialNumber})` : ''}`
          : d.serialNumber ?? d.id;

        const hasCert = certificates.some(
          (c) => c.userDeviceId === d.id && c.status === 'active',
        );

        let statusText = '';
        let statusClass = 'text-text-sub';
        if (inRepair) { statusText = 'в ремонте'; statusClass = 'text-warning'; }
        else if (addrInvalid) { statusText = 'адрес не подтверждён'; statusClass = 'text-error'; }
        else if (addrPending) { statusText = 'проверка...'; statusClass = 'text-warning'; }

        return {
          value: d.id,
          label,
          disabled: inRepair || addrInvalid,
          detail: (
            <span className="flex items-center gap-2 flex-shrink-0 text-xs">
              {statusText && <span className={statusClass}>{statusText}</span>}
              <span className={hasCert ? 'text-success' : 'text-text-sub'}>
                {hasCert ? 'Сертифицировано' : 'Без сертификата'}
              </span>
            </span>
          ),
        };
      }),
    [devices, certificates, devicesInRepair],
  );

  // Reset broken parts + localCert when device changes
  useEffect(() => {
    setSelectedParts([]);
    setDeviceParts([]);
    setLocalCert(null);
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
        ...(sp.note ? { note: sp.note } : {}),
      }));
      const { data } = await repairRequestApi.create({
        userDeviceId,
        description: description.trim(),
        ...(applied?.cert.id ? { certificateId: applied.cert.id } : {}),
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
              <Button variant="primary" size="sm" onClick={() => setShowAddDevice(true)}>
                Добавить устройство
              </Button>
            </div>
          ) : (
            <ListSelect
              value={userDeviceId}
              onChange={setUserDeviceId}
              options={deviceOptions}
              placeholder="Выберите устройство"
            />
          )}
        </FormField>

        {/* Address validation warning */}
        {userDeviceId && (() => {
          const sel = devices.find((d) => d.id === userDeviceId);
          const vs = sel?.address?.validationStatus;
          if (vs === 'pending') return (
            <div className="px-4 py-3 bg-warning-bg border border-warning-border text-sm text-warning-deep">
              Адрес устройства проходит проверку. Отправка заявки будет доступна после подтверждения.
            </div>
          );
          if (vs === 'invalid' || vs === 'error') return (
            <div className="px-4 py-3 bg-error-bg border border-error-border text-sm text-error-deep">
              Адрес устройства не прошёл проверку{sel?.address?.validationError ? `: ${sel.address.validationError}` : ''}. Обновите адрес в разделе «Сертификаты».
            </div>
          );
          return null;
        })()}

        {/* Certificate (read-only auto-applied card) */}
        {userDeviceId && (
          <FormField label="Сертификат" variant="bold">
            {applied ? (
              <div className="flex flex-col gap-2 border border-border-light px-4 py-3">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <span className="font-medium text-text-main">№{applied.cert.certificateNumber}</span>
                  {applied.cert.status === 'pending_payment' ? (
                    <span className="inline-flex items-center px-2 py-0.5 text-xs bg-warning-bg text-warning-deep border border-warning-border">
                      Ожидает оплаты
                    </span>
                  ) : (
                    <span className="text-xs text-text-sub">Применён к заявке</span>
                  )}
                </div>
                <span className="text-sm text-text-sub">
                  Действителен до {formatDateRu(applied.cert.expiresAt)}
                </span>
                {applied.cert.status === 'pending_payment' && (
                  <>
                    <p className="text-xs text-text-sub">
                      Сертификат ещё не оплачен. Вы можете оплатить его сейчас или отправить заявку — сертификат применится автоматически после оплаты.
                    </p>
                    <Button
                      variant="secondary"
                      size="sm"
                      type="button"
                      onClick={() => setShowPayment(true)}
                      className="w-fit"
                    >
                      Оплатить сейчас
                    </Button>
                  </>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <p className="text-sm text-text-sub">
                  Сертификата нет — создайте новый или отправьте заявку без сертификата.
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  type="button"
                  onClick={() => setShowCreateCert(true)}
                  className="w-fit"
                >
                  Добавить сертификат
                </Button>
              </div>
            )}
          </FormField>
        )}

        {/* Broken parts selection */}
        {userDeviceId && (
          <FormField label="Предположения о неисправности (необязательно)" variant="bold">
            <div className="flex flex-col gap-3">
              <p className="text-xs text-text-sub">
                Ваши предположения о том, что могло сломаться. Это подсказка для мастера — окончательный список запчастей определит он после диагностики.
              </p>
              <BrokenPartsDraftEditor
                parts={selectedParts}
                onChange={setSelectedParts}
                deviceParts={deviceParts}
              />
            </div>
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
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-dark-deep/60 text-text-on-dark flex items-center justify-center text-xs leading-none cursor-pointer"
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

      <CreateCertificateModal
        open={showCreateCert}
        userDeviceId={userDeviceId}
        onClose={() => setShowCreateCert(false)}
        onSuccess={(cert) => {
          setCertificates((prev) => [cert, ...prev]);
          setLocalCert(cert);
        }}
      />

      {applied?.cert.status === 'pending_payment' && (
        <PaymentModal
          open={showPayment}
          onClose={() => { setShowPayment(false); fetchData(); }}
          targetType="certificate"
          targetId={applied.cert.id}
          amount={applied.cert.price ?? 0}
        />
      )}
    </PageContainer>
  );
}
