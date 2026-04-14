'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Button,
  FormField,
  Select,
  ListSelect,
  Modal,
  SkeletonBlock,
} from '@asko/ui';
import type { ListSelectOption } from '@asko/ui';
import {
  CERTIFICATE_DURATION_OPTIONS,
  CERTIFICATE_DURATION_LABELS,
  CertificateStatus,
} from '@asko/shared/client';
import { certificateApi } from '@/lib/api/certificate';
import { userDeviceApi } from '@/lib/api/user-device';
import type { ICertificate } from '@/lib/api/types';
import type { UserDevice } from './types';

type DeviceCertState =
  | { kind: 'none' }
  | { kind: 'active'; cert: ICertificate }
  | { kind: 'expired'; cert: ICertificate };

type RenewalMode = 'extend' | 'new';

function isExpired(cert: ICertificate): boolean {
  return (
    cert.status === CertificateStatus.EXPIRED ||
    new Date(cert.expiresAt).getTime() < Date.now()
  );
}

function isActiveOrPending(cert: ICertificate): boolean {
  return (
    (cert.status === CertificateStatus.ACTIVE ||
      cert.status === CertificateStatus.PENDING_PAYMENT) &&
    new Date(cert.expiresAt).getTime() >= Date.now()
  );
}

/**
 * For a given user device, determine which certificate (if any) governs its
 * current state. Priority: latest active/pending > latest expired > none.
 */
function resolveDeviceCertState(
  deviceId: string,
  certificates: ICertificate[],
): DeviceCertState {
  const forDevice = certificates.filter(
    (c) =>
      c.userDeviceId === deviceId &&
      c.status !== CertificateStatus.REVOKED &&
      c.status !== CertificateStatus.VALIDATION_ERROR,
  );
  if (forDevice.length === 0) return { kind: 'none' };

  const activeOrPending = forDevice
    .filter(isActiveOrPending)
    .sort((a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime());
  if (activeOrPending.length > 0) {
    return { kind: 'active', cert: activeOrPending[0] };
  }

  const expired = forDevice
    .filter(isExpired)
    .sort((a, b) => new Date(b.expiresAt).getTime() - new Date(a.expiresAt).getTime());
  if (expired.length > 0) {
    return { kind: 'expired', cert: expired[0] };
  }

  return { kind: 'none' };
}

const priceFormatter = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
  maximumFractionDigits: 0,
});

export function AddCertificateForm({
  open,
  onClose,
  onSuccess,
  onOpenAddDevice,
  certificates,
  initialDeviceId,
  initialRenewalMode,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: (cert: ICertificate) => void;
  onOpenAddDevice?: () => void;
  certificates: ICertificate[];
  initialDeviceId?: string;
  initialRenewalMode?: RenewalMode;
}) {
  const [devices, setDevices] = useState<UserDevice[]>([]);
  const [loadingDevices, setLoadingDevices] = useState(true);
  const [deviceId, setDeviceId] = useState('');
  const [durationMonths, setDurationMonths] = useState<number>(12);
  const [renewalMode, setRenewalMode] = useState<RenewalMode>('extend');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Price preview
  const [price, setPrice] = useState<number | null>(null);
  const [priceLoading, setPriceLoading] = useState(false);

  // Devices eligible for certificate creation (exclude active/pending certs)
  const selectableDevices = useMemo(
    () => devices.filter((d) => resolveDeviceCertState(d.id, certificates).kind !== 'active'),
    [devices, certificates],
  );

  const deviceOptions: ListSelectOption[] = useMemo(
    () =>
      selectableDevices.map((d) => {
        const state = resolveDeviceCertState(d.id, certificates);
        const name = `${d.device?.name ?? ''} ${d.device?.brand ?? ''} ${d.device?.model ?? ''}`.trim() || d.id;
        const vs = d.address?.validationStatus;
        const blocked = vs === 'invalid' || vs === 'error';

        let statusText = '';
        let statusClass = 'text-text-sub';
        if (blocked) { statusText = 'адрес не подтверждён'; statusClass = 'text-error'; }
        else if (vs === 'pending') { statusText = 'проверка...'; statusClass = 'text-warning'; }
        else if (state.kind === 'expired') { statusText = 'сертификат истёк'; }

        return {
          value: d.id,
          label: name,
          disabled: blocked,
          detail: statusText
            ? <span className={`text-xs flex-shrink-0 ${statusClass}`}>{statusText}</span>
            : undefined,
        };
      }),
    [selectableDevices, certificates],
  );

  useEffect(() => {
    if (!open) return;
    setLoadingDevices(true);
    setError('');
    userDeviceApi
      .getMy()
      .then(({ data }) => {
        setDevices(data);
        const selectable = data.filter(
          (d) => resolveDeviceCertState(d.id, certificates).kind !== 'active',
        );
        const preferred = initialDeviceId && selectable.some((d) => d.id === initialDeviceId)
          ? initialDeviceId
          : selectable[0]?.id ?? '';
        setDeviceId(preferred);
      })
      .catch(() => {})
      .finally(() => setLoadingDevices(false));
  }, [open]);

  const selectedDevice = devices.find((d) => d.id === deviceId);
  const selectedDeviceState = useMemo(
    () => (deviceId ? resolveDeviceCertState(deviceId, certificates) : { kind: 'none' as const }),
    [deviceId, certificates],
  );

  // Reset renewal mode on device change
  useEffect(() => {
    setRenewalMode(initialRenewalMode ?? 'extend');
  }, [deviceId, initialRenewalMode]);

  // Price preview — debounced
  useEffect(() => {
    if (!deviceId || !durationMonths) {
      setPrice(null);
      return;
    }
    setPriceLoading(true);
    const handle = setTimeout(() => {
      certificateApi
        .calculatePrice(deviceId, durationMonths)
        .then(({ data }) => setPrice(data.price))
        .catch(() => setPrice(null))
        .finally(() => setPriceLoading(false));
    }, 200);
    return () => {
      clearTimeout(handle);
      setPriceLoading(false);
    };
  }, [deviceId, durationMonths]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!deviceId) return;

      const vs = selectedDevice?.address?.validationStatus;
      if (vs === 'pending') {
        setError('Адрес устройства ещё проходит проверку. Попробуйте через несколько секунд.');
        return;
      }
      if (vs === 'invalid' || vs === 'error') {
        setError('Адрес устройства не прошёл проверку. Обновите адрес устройства.');
        return;
      }

      setSubmitting(true);
      setError('');
      try {
        const useExtend =
          selectedDeviceState.kind === 'expired' && renewalMode === 'extend';

        let newCert: ICertificate;
        if (useExtend) {
          const { data } = await certificateApi.reapply(selectedDeviceState.cert.id, {
            durationMonths,
          });
          newCert = data;
        } else {
          const { data } = await certificateApi.selfCreate({
            userDeviceId: deviceId,
            durationMonths,
          });
          newCert = data.certificate;
        }
        setDurationMonths(12);
        onClose();
        onSuccess(newCert);
      } catch (err: any) {
        setError(err?.response?.data?.message ?? 'Не удалось добавить сертификат');
      } finally {
        setSubmitting(false);
      }
    },
    [deviceId, durationMonths, selectedDevice, selectedDeviceState, renewalMode, onClose, onSuccess],
  );

  return (
    <Modal open={open} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-6 w-full sm:w-[460px]">
        <h2 className="text-xl font-medium text-text-main">Добавить сертификат</h2>
        <p className="text-sm text-text-sub">
          Сертификат будет привязан к выбранному устройству. Стоимость зависит от срока действия и цены устройства.
        </p>

        <FormField label="Устройство">
          {loadingDevices ? (
            <SkeletonBlock className="h-10 w-full" />
          ) : devices.length === 0 ? (
            <div className="flex flex-col gap-2">
              <p className="text-sm text-text-sub">Нет зарегистрированных устройств</p>
              {onOpenAddDevice && (
                <button
                  type="button"
                  onClick={() => { onClose(); onOpenAddDevice(); }}
                  className="text-sm text-brand-red hover:underline cursor-pointer text-left"
                >
                  + Добавить устройство
                </button>
              )}
            </div>
          ) : selectableDevices.length === 0 ? (
            <div className="flex flex-col gap-2">
              <p className="text-sm text-text-sub">Все устройства уже имеют активный сертификат</p>
              {onOpenAddDevice && (
                <button
                  type="button"
                  onClick={() => { onClose(); onOpenAddDevice(); }}
                  className="text-sm text-brand-red hover:underline cursor-pointer text-left"
                >
                  + Добавить новое устройство
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              <ListSelect
                value={deviceId}
                onChange={setDeviceId}
                options={deviceOptions}
                placeholder="Выберите устройство"
              />
              {onOpenAddDevice && (
                <button
                  type="button"
                  onClick={() => { onClose(); onOpenAddDevice(); }}
                  className="text-sm text-brand-red hover:underline cursor-pointer text-left"
                >
                  + Добавить новое устройство
                </button>
              )}
            </div>
          )}
        </FormField>

        {selectedDeviceState.kind === 'active' && (
          <div className="flex items-start gap-2 p-3 bg-warning-bg border border-warning-border">
            <p className="text-xs text-warning-deep">
              У этого устройства уже есть активный сертификат (до{' '}
              {new Date(selectedDeviceState.cert.expiresAt).toLocaleDateString('ru-RU')}).
              Новый сертификат будет создан дополнительно.
            </p>
          </div>
        )}

        {selectedDeviceState.kind === 'expired' && (
          <div className="flex flex-col gap-2">
            <p className="text-xs text-text-sub">
              Сертификат устройства истёк{' '}
              {new Date(selectedDeviceState.cert.expiresAt).toLocaleDateString('ru-RU')}.
              Выберите действие:
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRenewalMode('extend')}
                className={`flex flex-col items-start gap-1 p-3 border-2 text-left cursor-pointer transition-colors ${
                  renewalMode === 'extend'
                    ? 'border-brand-red bg-primary-50'
                    : 'border-border-light/50 hover:border-text-sub'
                }`}
              >
                <span className="text-sm font-medium text-text-main">Продлить</span>
                <span className="text-xs text-text-sub">Сохранить историю устройства</span>
              </button>
              <button
                type="button"
                onClick={() => setRenewalMode('new')}
                className={`flex flex-col items-start gap-1 p-3 border-2 text-left cursor-pointer transition-colors ${
                  renewalMode === 'new'
                    ? 'border-brand-red bg-primary-50'
                    : 'border-border-light/50 hover:border-text-sub'
                }`}
              >
                <span className="text-sm font-medium text-text-main">Новый сертификат</span>
                <span className="text-xs text-text-sub">Отдельная запись</span>
              </button>
            </div>
          </div>
        )}

        <FormField label="Срок действия">
          <Select
            value={String(durationMonths)}
            onChange={(e) => setDurationMonths(Number(e.target.value))}
          >
            {CERTIFICATE_DURATION_OPTIONS.map((months) => (
              <option key={months} value={months}>
                {CERTIFICATE_DURATION_LABELS[months]}
              </option>
            ))}
          </Select>
        </FormField>

        <div className="flex items-center justify-between py-2 border-t border-border-light">
          <span className="text-sm text-text-sub">Стоимость</span>
          {priceLoading ? (
            <SkeletonBlock className="h-5 w-24" />
          ) : price != null ? (
            <span className="text-base font-medium text-text-main">
              {priceFormatter.format(price)}
            </span>
          ) : (
            <span className="text-sm text-text-sub">—</span>
          )}
        </div>

        {error && <p className="text-sm text-brand-red">{error}</p>}

        <div className="flex gap-3 justify-end">
          <Button variant="secondary" type="button" onClick={onClose}>
            Отмена
          </Button>
          <Button
            variant="primary"
            type="submit"
            disabled={submitting || !deviceId || !durationMonths}
          >
            {submitting ? 'Отправка...' : 'Добавить'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
