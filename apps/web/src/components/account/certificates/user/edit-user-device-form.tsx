'use client';

import { useState, useEffect } from 'react';
import {
  Button,
  Modal,
  AddressInput,
  type AddressValue,
} from '@asko/ui';
import { userDeviceApi } from '@/lib/api/user-device';
import { addressApi } from '@/lib/api/address';
import type { UserDevice } from './types';

function toAddressValue(address: UserDevice['address']): AddressValue | null {
  if (!address || !address.city || !address.street || address.house == null) return null;
  return {
    country: address.country ?? 'Россия',
    city: address.city,
    street: address.street,
    house: address.house,
    building: address.building,
    floor: address.floor,
    room: address.room,
    latitude: address.latitude,
    longitude: address.longitude,
  };
}

export function EditUserDeviceForm({
  open,
  device,
  onClose,
  onSuccess,
}: {
  open: boolean;
  device: UserDevice | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [addressValue, setAddressValue] = useState<AddressValue | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && device) {
      setAddressValue(toAddressValue(device.address));
      setError('');
    }
  }, [open, device]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!device || !addressValue) return;
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
      await userDeviceApi.update(device.id, { addressId: address.id });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Не удалось обновить адрес');
    } finally {
      setSubmitting(false);
    }
  }

  const deviceName = device?.device?.name ?? 'Устройство';
  const brandModel = [device?.device?.brand, device?.device?.model].filter(Boolean).join(' ');

  return (
    <Modal open={open} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-6 w-full sm:w-[460px]">
        <h2 className="text-xl font-medium text-text-main">Изменить адрес устройства</h2>

        {device && (
          <div className="flex flex-col gap-0.5">
            <p className="text-sm font-medium text-text-main">{deviceName}</p>
            {brandModel && <p className="text-xs text-text-sub">{brandModel}</p>}
          </div>
        )}

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
            disabled={submitting || !addressValue}
          >
            {submitting ? 'Сохранение...' : 'Сохранить'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
