'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button, Input, FormField, Select, Modal, SerialNumberInput } from '@asko/ui';
import { PageContainer } from '@/components/account/page-container';
import { PageHeader } from '@/components/account/page-header';
import { PaymentModal } from '@/components/account/user/payment-modal';
import { userApi } from '@/lib/api/user';
import { fileUploadApi } from '@/lib/api/file-upload';
import { CertificateStatus } from '@asko/shared/client';
import { ICertificate } from '@asko/shared/client';

const STATUS_LABELS: Record<string, string> = {
  [CertificateStatus.PENDING_PAYMENT]: 'Ожидает оплаты',
  [CertificateStatus.VALIDATION_ERROR]: 'Ошибка валидации',
  [CertificateStatus.ACTIVE]: 'Активен',
  [CertificateStatus.EXPIRED]: 'Истек',
  [CertificateStatus.REVOKED]: 'Отозван',
};

function formatDate(dateStr: Date | string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatDateLong(dateStr: Date | string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
}

function FileTextIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
      <path d="M10 13H8" />
      <path d="M16 17H8" />
      <path d="M16 13h-2" />
    </svg>
  );
}

function CertificateCard({ cert, onPay }: { cert: ICertificate; onPay?: (cert: ICertificate) => void }) {
  const isActive = cert.status === CertificateStatus.ACTIVE;
  const isPendingPayment = cert.status === CertificateStatus.PENDING_PAYMENT;
  const device = cert.userDevice?.device;
  const deviceName = device?.name ?? 'Устройство';
  const brandModel = [device?.brand, device?.model].filter(Boolean).join(' ');
  const deviceDesc = device?.description
    ?? 'Устройство зарегистрировано и защищено расширенной гарантией ASKO.\nСертификат подтверждает право на обслуживание и ремонт.';

  const durationMs = new Date(cert.expiresAt).getTime() - new Date(cert.issuedAt).getTime();
  const durationMonths = Math.round(durationMs / (1000 * 60 * 60 * 24 * 30));

  const [deviceImageUrl, setDeviceImageUrl] = useState('/images/placeholder.webp');
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!device?.id) return;
    fileUploadApi.getDeviceImages(device.id).then(({ data }) => {
      const images = Array.isArray(data) ? data : [];
      if (images.length > 0) {
        const img = images[0];
        const url = img.imageJson?.medium?.secure_url ?? img.imageJson?.original?.secure_url;
        if (url) setDeviceImageUrl(url);
      }
    }).catch(() => { });
  }, [device?.id]);

  const handleExportPdf = useCallback(() => {
    const card = cardRef.current;
    if (!card) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Сертификат ${cert.certificateNumber}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; padding: 40px; color: #323232; }
          .card { border: 1px solid #eaeaea; border-radius: 8px; padding: 24px; position: relative; min-height: 420px; }
          .title { font-size: 28px; font-weight: 400; line-height: 1.2; margin-bottom: 8px; }
          .title strong { font-weight: 500; }
          .desc { font-size: 13px; color: #979797; line-height: 1.5; margin-bottom: 24px; max-width: 500px; }
          .details { display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px; }
          .details p { font-size: 16px; line-height: 1.4; }
          .details strong { font-weight: 500; }
          .status-line { display: flex; align-items: center; gap: 8px; font-size: 13px; margin-bottom: 4px; }
          .status-active { color: #108b00; font-weight: 500; }
          .warranty { font-size: 13px; margin-bottom: 24px; }
          .device-img { position: absolute; right: 24px; top: 100px; width: 220px; height: 310px; object-fit: contain; border-radius: 8px; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="title">${deviceName} ${brandModel ? `<strong>${brandModel}</strong>` : ''}</div>
          <div class="desc">${deviceDesc.replace(/\n/g, '<br>')}</div>
          <div class="details">
            <p>Номер сертификата: <strong>${cert.certificateNumber}</strong></p>
            <p>Дата активации: <strong>${formatDate(cert.issuedAt)}</strong></p>
            <p>Срок действия: <strong>${durationMonths} месяцев</strong></p>
          </div>
          <div class="status-line">
            <span>Статус: <span class="${isActive ? 'status-active' : ''}">${STATUS_LABELS[cert.status] ?? cert.status}</span></span>
            <span style="color:#979797">Действителен до ${formatDateLong(cert.expiresAt)}</span>
          </div>
          ${isActive ? '<div class="warranty">Расширенная гарантия активна</div>' : ''}
          <img class="device-img" src="${deviceImageUrl}" alt="${deviceName}" />
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();

    // Wait for image to load before printing
    const img = printWindow.document.querySelector('img');
    if (img) {
      img.onload = () => { printWindow.print(); };
      img.onerror = () => { printWindow.print(); };
    } else {
      printWindow.print();
    }
  }, [cert, deviceName, brandModel, deviceDesc, durationMonths, isActive, deviceImageUrl]);

  return (
    <div
      ref={cardRef}
      className="relative border border-border-light bg-white rounded-sm p-6 shadow-[0_10px_60px_0_rgba(226,236,249,0.5)]"
    >
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left content */}
        <div className="flex flex-col gap-0 flex-1 min-w-0">
          {/* Title */}
          <h2 className="text-2xl lg:text-[32px] leading-tight text-text-main tracking-tight">
            {deviceName}{' '}
            {brandModel && <span className="font-medium">{brandModel}</span>}
          </h2>
          <p className="text-sm leading-relaxed text-text-sub mt-2 max-w-[527px] whitespace-pre-line">
            {deviceDesc}
          </p>

          {/* Certificate details */}
          <div className="flex flex-col gap-2 mt-6">
            <p className="text-lg text-text-main tracking-tight">
              Номер сертификата: <span className="font-medium">{cert.certificateNumber}</span>
            </p>
            <p className="text-lg text-text-main tracking-tight">
              Дата активации: <span className="font-medium">{formatDate(cert.issuedAt)}</span>
            </p>
            <p className="text-lg text-text-main tracking-tight">
              Срок действия: <span className="font-medium">{durationMonths} месяцев</span>
            </p>
          </div>

          {/* Status line */}
          <div className="flex flex-col gap-1 mt-6">
            <div className="flex items-center gap-2 text-sm">
              <span>
                Статус:{' '}
                <span className={
                  isActive ? 'text-green-600 font-medium'
                    : isPendingPayment ? 'text-orange-600 font-medium'
                      : 'text-text-sub font-medium'
                }>
                  {STATUS_LABELS[cert.status] ?? cert.status}
                </span>
              </span>
              <span className="text-text-sub">
                Действителен до {formatDateLong(cert.expiresAt)}
              </span>
            </div>
            {isActive && <p className="text-sm text-text-main">Расширенная гарантия активна</p>}
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-3 mt-6">
            {isPendingPayment && onPay && (
              <button
                type="button"
                onClick={() => onPay(cert)}
                className="flex items-center gap-2 bg-brand-red text-white px-6 py-2.5 text-sm font-medium cursor-pointer hover:bg-brand-red/90 transition-colors"
              >
                Оплатить {cert.price ? `${cert.price.toLocaleString('ru-RU')} ₽` : ''}
              </button>
            )}
            <button
              type="button"
              onClick={handleExportPdf}
              className="flex items-center gap-2 border border-border-light px-6 py-2.5 text-sm font-medium text-text-main cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <FileTextIcon />
              Скачать сертификат PDF
            </button>
          </div>
        </div>

        {/* Device image */}
        <div className="hidden lg:block flex-shrink-0 w-[236px] self-start mt-4">
          <img
            src={deviceImageUrl}
            alt={deviceName}
            className="w-full h-auto max-h-[332px] object-contain rounded-lg"
          />
        </div>
      </div>
    </div>
  );
}

interface UserDevice {
  id: string;
  serialNumber?: string;
  device?: { name?: string; brand?: string; model?: string };
  address?: { city?: string; street?: string; house?: number };
  createdAt?: Date | string;
}

function DeviceSlider({
  devices,
  loading,
}: {
  devices: UserDevice[];
  loading: boolean;
}) {
  if (loading) return <p className="text-sm text-text-sub">Загрузка устройств...</p>;
  if (devices.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-lg font-bold text-text-main">Мои устройства</h2>
      <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-thin">
        {devices.map((ud) => {
          const name = ud.device?.name ?? 'Устройство';
          const subtitle = [ud.device?.brand, ud.device?.model].filter(Boolean).join(' ');
          const addr = ud.address
            ? [ud.address.city, ud.address.street, ud.address.house].filter(Boolean).join(', ')
            : null;
          return (
            <div
              key={ud.id}
              className="flex-shrink-0 w-[260px] border border-border-light rounded-sm p-4 flex flex-col gap-2"
            >
              <p className="text-sm font-medium text-text-main truncate">{name}</p>
              {subtitle && <p className="text-xs text-text-sub truncate">{subtitle}</p>}
              {ud.serialNumber && (
                <p className="text-xs text-text-sub">S/N: {ud.serialNumber}</p>
              )}
              {addr && <p className="text-xs text-text-sub truncate">{addr}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface CatalogDevice {
  id: string;
  name: string;
  brand: string;
  model: string;
}

function AddDeviceForm({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [catalog, setCatalog] = useState<CatalogDevice[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [deviceId, setDeviceId] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [city, setCity] = useState('');
  const [street, setStreet] = useState('');
  const [house, setHouse] = useState('');
  const [building, setBuilding] = useState('');
  const [floor, setFloor] = useState('');
  const [room, setRoom] = useState('');
  const [detecting, setDetecting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const detectAddress = async () => {
    if (!navigator.geolocation) {
      setError('Геолокация не поддерживается браузером');
      return;
    }
    setDetecting(true);
    setError('');
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 }),
      );
      const { latitude, longitude } = pos.coords;
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=ru`,
      );
      const data = await res.json();
      const a = data.address ?? {};
      setCity(a.city || a.town || a.village || '');
      setStreet(a.road || '');
      if (a.house_number) setHouse(String(parseInt(a.house_number, 10) || ''));
    } catch {
      setError('Не удалось определить адрес');
    } finally {
      setDetecting(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    setLoadingCatalog(true);
    userApi
      .getDeviceCatalog({ limit: 200 })
      .then(({ data }) => {
        const list = Array.isArray(data) ? data : data.data ?? [];
        setCatalog(list);
        if (list.length > 0 && !deviceId) setDeviceId(list[0].id);
      })
      .catch(() => { })
      .finally(() => setLoadingCatalog(false));
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!deviceId || !serialNumber || !city || !street || !house) return;
    setSubmitting(true);
    setError('');
    try {
      const { data: address } = await userApi.createAddress({
        country: 'Россия',
        city,
        street,
        house: Number(house),
        ...(building ? { building: Number(building) } : {}),
        ...(floor ? { floor: Number(floor) } : {}),
        ...(room ? { room: Number(room) } : {}),
      });
      await userApi.registerDevice({
        deviceId,
        serialNumber: serialNumber.trim(),
        addressId: address.id,
      });
      setSerialNumber('');
      setCity('');
      setStreet('');
      setHouse('');
      setBuilding('');
      setFloor('');
      setRoom('');
      setDeviceId('');
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Не удалось зарегистрировать устройство');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-6 w-full sm:w-[460px]">
        <h2 className="text-xl font-medium text-text-main">Добавить устройство</h2>

        <FormField label="Устройство">
          {loadingCatalog ? (
            <p className="text-sm text-text-sub">Загрузка...</p>
          ) : catalog.length === 0 ? (
            <p className="text-sm text-text-sub">Нет доступных устройств</p>
          ) : (
            <Select value={deviceId} onChange={(e) => setDeviceId(e.target.value)}>
              {catalog.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.brand} {d.name} ({d.model})
                </option>
              ))}
            </Select>
          )}
        </FormField>

        <FormField label="Серийный номер">
          <SerialNumberInput
            value={serialNumber}
            onValueChange={setSerialNumber}
            required
          />
        </FormField>

        <div className="flex items-center justify-between mt-1">
          <p className="text-sm font-medium text-text-main">Адрес установки</p>
          <Button variant="secondary" size="sm" type="button" onClick={detectAddress} disabled={detecting}>
            {detecting ? 'Определение...' : 'Определить автоматически'}
          </Button>
        </div>

        <div className="flex gap-3">
          <FormField label="Город" className="flex-1">
            <Input
              placeholder="Москва"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              required
            />
          </FormField>
          <FormField label="Улица" className="flex-1">
            <Input
              placeholder="Ленина"
              value={street}
              onChange={(e) => setStreet(e.target.value)}
              required
            />
          </FormField>
        </div>

        <div className="flex gap-3">
          <FormField label="Дом" className="flex-1">
            <Input
              placeholder="1"
              value={house}
              onChange={(e) => setHouse(e.target.value)}
              type="number"
              required
            />
          </FormField>
          <FormField label="Корпус" className="flex-1">
            <Input
              placeholder="-"
              value={building}
              onChange={(e) => setBuilding(e.target.value)}
              type="number"
            />
          </FormField>
        </div>

        <div className="flex gap-3">
          <FormField label="Этаж" className="flex-1">
            <Input
              placeholder="-"
              value={floor}
              onChange={(e) => setFloor(e.target.value)}
              type="number"
            />
          </FormField>
          <FormField label="Помещение" className="flex-1">
            <Input
              placeholder="-"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              type="number"
            />
          </FormField>
        </div>

        {error && <p className="text-sm text-brand-red">{error}</p>}

        <div className="flex gap-3 justify-end">
          <Button variant="secondary" type="button" onClick={onClose}>
            Отмена
          </Button>
          <Button
            variant="primary"
            type="submit"
            disabled={submitting || !deviceId || !serialNumber || serialNumber === 'SN-' || !city || !street || !house}
          >
            {submitting ? 'Регистрация...' : 'Зарегистрировать'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function AddCertificateForm({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: (cert: ICertificate) => void;
}) {
  const [devices, setDevices] = useState<UserDevice[]>([]);
  const [loadingDevices, setLoadingDevices] = useState(true);
  const [deviceId, setDeviceId] = useState('');
  const [certNumber, setCertNumber] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setLoadingDevices(true);
    userApi
      .getMyDevices()
      .then(({ data }) => {
        setDevices(data);
        if (data.length > 0 && !deviceId) setDeviceId(data[0].id);
      })
      .catch(() => { })
      .finally(() => setLoadingDevices(false));
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!deviceId || !certNumber || !expiresAt) return;
    setSubmitting(true);
    setError('');
    try {
      const { data: newCert } = await userApi.addCertificate({
        userDeviceId: deviceId,
        certificateNumber: certNumber.trim(),
        expiresAt,
      });
      setCertNumber('');
      setExpiresAt('');
      setDeviceId('');
      onClose();
      onSuccess(newCert);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Не удалось добавить сертификат');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-6 w-full sm:w-[420px]">
        <h2 className="text-xl font-medium text-text-main">Добавить сертификат</h2>
        <FormField label="Устройство">
          {loadingDevices ? (
            <p className="text-sm text-text-sub">Загрузка...</p>
          ) : devices.length === 0 ? (
            <p className="text-sm text-text-sub">Нет зарегистрированных устройств</p>
          ) : (
            <Select value={deviceId} onChange={(e) => setDeviceId(e.target.value)}>
              {devices.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.device?.name ?? d.id}
                </option>
              ))}
            </Select>
          )}
        </FormField>

        <FormField label="Номер сертификата">
          <Input
            placeholder="ASKO-0000-0000"
            value={certNumber}
            onChange={(e) => setCertNumber(e.target.value)}
            required
          />
        </FormField>

        <FormField label="Действителен до">
          <Input
            type="date"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            required
          />
        </FormField>

        {error && <p className="text-sm text-brand-red">{error}</p>}

        <div className="flex gap-3 justify-end">
          <Button variant="secondary" type="button" onClick={onClose}>
            Отмена
          </Button>
          <Button
            variant="primary"
            type="submit"
            disabled={submitting || !deviceId || !certNumber || !expiresAt}
          >
            {submitting ? 'Отправка...' : 'Добавить'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function UserCertificates() {
  const [certificates, setCertificates] = useState<ICertificate[]>([]);
  const [devices, setDevices] = useState<UserDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingDevices, setLoadingDevices] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showAddDevice, setShowAddDevice] = useState(false);
  const [paymentCert, setPaymentCert] = useState<ICertificate | null>(null);

  const handlePay = (cert: ICertificate) => {
    setPaymentCert(cert);
  };

  const handlePaymentClose = () => {
    setPaymentCert(null);
    fetchCertificates();
  };

  const fetchCertificates = async () => {
    setLoading(true);
    try {
      const { data } = await userApi.getMyCertificates();
      setCertificates(data);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  const fetchDevices = async () => {
    setLoadingDevices(true);
    try {
      const { data } = await userApi.getMyDevices();
      setDevices(data);
    } catch {
      // silently fail
    } finally {
      setLoadingDevices(false);
    }
  };

  useEffect(() => {
    fetchCertificates();
    fetchDevices();
  }, []);

  return (
    <PageContainer>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader>Мои сертификаты</PageHeader>
        <Button variant="primary" size="sm" onClick={() => setShowAddForm(true)}>
          Добавить сертификат
        </Button>
      </div>

      <DeviceSlider devices={devices} loading={loadingDevices} />

      {loading ? (
        <p className="text-sm text-text-sub">Загрузка...</p>
      ) : certificates.length === 0 ? (
        <p className="text-sm text-text-sub">У вас нет сертификатов</p>
      ) : (
        certificates.map((cert) => (
          <CertificateCard key={cert.id} cert={cert} onPay={handlePay} />
        ))
      )}

      {/* Add new device section */}
      <div className="flex flex-col gap-3">
        <h2 className="text-2xl lg:text-[28px] font-bold text-text-main">
          Новое устройство?
        </h2>
        <p className="text-sm text-text-sub max-w-md">
          Зарегистрируйте устройство, чтобы активировать сертификат и получить доступ к
          обслуживанию
        </p>
        <Button variant="primary" className="w-full lg:w-fit mt-2" onClick={() => setShowAddDevice(true)}>
          Добавить устройство
        </Button>
      </div>

      <AddCertificateForm
        open={showAddForm}
        onClose={() => setShowAddForm(false)}
        onSuccess={(cert) => {
          fetchCertificates();
          if (cert.status === CertificateStatus.PENDING_PAYMENT && cert.price) {
            setPaymentCert(cert);
          }
        }}
      />

      <AddDeviceForm
        open={showAddDevice}
        onClose={() => setShowAddDevice(false)}
        onSuccess={() => { fetchCertificates(); fetchDevices(); }}
      />

      {paymentCert && (
        <PaymentModal
          open={!!paymentCert}
          onClose={handlePaymentClose}
          targetType="certificate"
          targetId={paymentCert.id}
          amount={paymentCert.price ?? 0}
        />
      )}
    </PageContainer>
  );
}
