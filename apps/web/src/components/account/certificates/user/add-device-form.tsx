'use client';

import { useState, useEffect } from 'react';
import {
  Button,
  FormField,
  Select,
  Modal,
  SerialNumberInput,
  AddressInput,
  SkeletonBlock,
  type AddressValue,
} from '@asko/ui';
import { userDeviceApi } from '@/lib/api/user-device';
import { addressApi } from '@/lib/api/address';
import { deviceApi } from '@/lib/api/device';
import type { CatalogDevice } from './types';

export function AddDeviceForm({
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
  const [addressValue, setAddressValue] = useState<AddressValue | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setLoadingCatalog(true);
    deviceApi
      .getAll({ limit: 200 })
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
    if (!deviceId || !serialNumber || !addressValue) return;
    setSubmitting(true);
    setError('');
    try {
      const { data: address } = await addressApi.create({
        country: addressValue.country,
        city: addressValue.city,
        street: addressValue.street,
        house: addressValue.house,
        ...(addressValue.building ? { building: addressValue.building } : {}),
        ...(addressValue.floor ? { floor: addressValue.floor } : {}),
        ...(addressValue.room ? { room: addressValue.room } : {}),
        ...(addressValue.latitude != null ? { latitude: addressValue.latitude } : {}),
        ...(addressValue.longitude != null ? { longitude: addressValue.longitude } : {}),
      });
      await userDeviceApi.register({
        deviceId,
        serialNumber: serialNumber.trim(),
        addressId: address.id,
      });
      setSerialNumber('');
      setAddressValue(null);
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
            <SkeletonBlock className="h-10 w-full" />
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

        <AddressInput
          value={addressValue}
          onChange={setAddressValue}
          showGeolocation
          label="Адрес установки"
        />

        {error && <p className="text-sm text-brand-red">{error}</p>}

        <div className="flex gap-3 justify-end">
          <Button variant="secondary" type="button" onClick={onClose}>
            Отмена
          </Button>
          <Button
            variant="primary"
            type="submit"
            disabled={submitting || !deviceId || !serialNumber || serialNumber === 'SN-' || !addressValue}
          >
            {submitting ? 'Регистрация...' : 'Зарегистрировать'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
