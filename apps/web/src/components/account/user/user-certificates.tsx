'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, Button, Input, FormField, Select, Modal } from '@asko/ui';
import { PageContainer } from '@/components/account/page-container';
import { PageHeader } from '@/components/account/page-header';
import { userApi } from '@/lib/api/user';
import { CertificateStatus } from '@asko/shared/client';

const STATUS_LABELS: Record<string, string> = {
  [CertificateStatus.PENDING_APPROVAL]: 'На проверке',
  [CertificateStatus.ACTIVE]: 'Активен',
  [CertificateStatus.EXPIRED]: 'Истек',
  [CertificateStatus.REVOKED]: 'Отозван',
};

interface Certificate {
  id: string;
  certificateNumber: string;
  status: CertificateStatus;
  issuedAt: string;
  expiresAt: string;
  description?: string;
  userDevice?: {
    device?: {
      name?: string;
      description?: string;
    };
  };
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function StatusPill({
  label,
  value,
  active = false,
}: {
  label: string;
  value: string;
  active?: boolean;
}) {
  return (
    <div className="border border-border-light rounded-sm px-4 py-3 flex flex-col gap-0.5">
      <span className="text-xs text-text-sub">{label}</span>
      <span className={`text-sm font-medium ${active ? 'text-green-600' : 'text-text-main'}`}>
        {value}
      </span>
    </div>
  );
}

function CertificateCard({ cert }: { cert: Certificate }) {
  const isActive = cert.status === CertificateStatus.ACTIVE;
  const deviceName = cert.userDevice?.device?.name ?? 'Устройство';
  const deviceDesc = cert.userDevice?.device?.description
    ?? 'Устройство зарегистрировано и защищено расширенной гарантией ASKO.';

  const durationMs = new Date(cert.expiresAt).getTime() - new Date(cert.issuedAt).getTime();
  const durationMonths = Math.round(durationMs / (1000 * 60 * 60 * 24 * 30));

  return (
    <>
      {/* Status pills */}
      <div className="flex flex-wrap gap-3">
        <StatusPill
          label="Сертификат"
          value={STATUS_LABELS[cert.status] ?? cert.status}
          active={isActive}
        />
        <StatusPill label="Срок действия" value={`до ${formatDate(cert.expiresAt)}`} />
      </div>

      {/* Certificate card + sidebar */}
      <div className="flex flex-col lg:flex-row gap-6">
        <Card padding="lg" className="flex-1">
          <div className="flex flex-col gap-4">
            <h2 className="text-2xl lg:text-[32px] font-bold leading-tight text-text-main">
              {deviceName}
            </h2>
            <p className="text-sm leading-relaxed text-text-sub">
              {deviceDesc}
            </p>

            <div className="flex flex-col gap-2 mt-2">
              <p className="text-sm text-text-main">
                Номер сертификата: <strong>{cert.certificateNumber}</strong>
              </p>
              <p className="text-sm text-text-main">
                Дата активации: <strong>{formatDate(cert.issuedAt)}</strong>
              </p>
              <p className="text-sm text-text-main">
                Срок действия: <strong>{durationMonths} месяцев</strong>
              </p>
            </div>

            <div className="flex items-center gap-4 mt-2">
              <span className="text-sm">
                Статус:{' '}
                <span className={isActive ? 'text-green-600 font-medium' : 'text-text-sub font-medium'}>
                  {STATUS_LABELS[cert.status] ?? cert.status}
                </span>
              </span>
              <span className="text-sm text-text-sub">
                Действителен до {formatDate(cert.expiresAt)}
              </span>
            </div>
            {isActive && <p className="text-sm text-text-main">Расширенная гарантия активна</p>}
          </div>
        </Card>

        {/* Sidebar CTA */}
        <div className="lg:w-[280px] flex-shrink-0 bg-dark-deep rounded-sm p-6 flex flex-col gap-4 text-white">
          <h3 className="text-xl font-bold leading-tight">
            Возникла проблема с устройством?
          </h3>
          <p className="text-sm leading-relaxed text-white/80">
            Создайте заявку, и специалист сервисного центра ASKO свяжется с вами для
            диагностики и согласования ремонта.
          </p>
          <Link
            href="/account/requests/create"
            className="flex items-center justify-center px-6 py-2.5 text-sm font-medium text-white bg-brand-red mt-auto cursor-pointer"
          >
            Создать заявку
          </Link>
        </div>
      </div>
    </>
  );
}

interface UserDevice {
  id: string;
  serialNumber?: string;
  device?: { name?: string; brand?: string; model?: string };
  address?: { city?: string; street?: string; house?: number };
  createdAt?: string;
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
      .catch(() => {})
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
          <Input
            placeholder="SN-00000000"
            value={serialNumber}
            onChange={(e) => setSerialNumber(e.target.value)}
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
              placeholder="—"
              value={building}
              onChange={(e) => setBuilding(e.target.value)}
              type="number"
            />
          </FormField>
        </div>

        <div className="flex gap-3">
          <FormField label="Этаж" className="flex-1">
            <Input
              placeholder="—"
              value={floor}
              onChange={(e) => setFloor(e.target.value)}
              type="number"
            />
          </FormField>
          <FormField label="Помещение" className="flex-1">
            <Input
              placeholder="—"
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
            disabled={submitting || !deviceId || !serialNumber || !city || !street || !house}
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
  onSuccess: () => void;
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
        const list = Array.isArray(data) ? data : data.data ?? [];
        setDevices(list);
        if (list.length > 0 && !deviceId) setDeviceId(list[0].id);
      })
      .catch(() => {})
      .finally(() => setLoadingDevices(false));
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!deviceId || !certNumber || !expiresAt) return;
    setSubmitting(true);
    setError('');
    try {
      await userApi.addCertificate({
        userDeviceId: deviceId,
        certificateNumber: certNumber.trim(),
        expiresAt,
      });
      setCertNumber('');
      setExpiresAt('');
      setDeviceId('');
      onSuccess();
      onClose();
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
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [devices, setDevices] = useState<UserDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingDevices, setLoadingDevices] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showAddDevice, setShowAddDevice] = useState(false);

  const fetchCertificates = async () => {
    setLoading(true);
    try {
      const { data } = await userApi.getMyCertificates();
      const list = Array.isArray(data) ? data : data.data ?? [];
      setCertificates(list);
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
      const list = Array.isArray(data) ? data : data.data ?? [];
      setDevices(list);
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
        <PageHeader>Активные сертификаты</PageHeader>
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
          <CertificateCard key={cert.id} cert={cert} />
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
        onSuccess={fetchCertificates}
      />

      <AddDeviceForm
        open={showAddDevice}
        onClose={() => setShowAddDevice(false)}
        onSuccess={() => { fetchCertificates(); fetchDevices(); }}
      />
    </PageContainer>
  );
}
