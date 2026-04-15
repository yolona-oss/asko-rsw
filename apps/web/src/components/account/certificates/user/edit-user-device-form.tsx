'use client';

import { useState, useEffect } from 'react';
import {
  Button,
  Modal,
  AddressInput,
  type AddressValue,
  type SavedAddress,
} from '@asko/ui';
import { userDeviceApi } from '@/lib/api/user-device';
import { addressApi } from '@/lib/api/address';
import type { UserDevice } from './types';

function toAddressValue(address: UserDevice['address']): AddressValue | null {
  if (!address || !address.city || !address.street || address.house == null) return null;
  return {
    city: address.city,
    street: address.street,
    house: address.house,
    building: address.building,
    floor: address.floor,
    apartment: address.apartment,
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
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && device) {
      setAddressValue(toAddressValue(device.address));
      setError('');
    }
  }, [open, device]);

  useEffect(() => {
    if (!open) return;
    addressApi.list().then(({ data }) => {
      setSavedAddresses(data.map((a) => ({
        id: a.id,
        city: a.city,
        district: a.district,
        street: a.street,
        house: a.house,
        building: a.building,
        apartment: a.apartment,
        entrance: a.entrance,
        floor: a.floor,
        intercom: a.intercom,
        comment: a.comment,
        isPrimary: a.isPrimary,
      })));
    }).catch(() => { });
  }, [open]);

  const handleSetPrimary = async (id: string) => {
    try {
      await addressApi.setPrimary(id);
      setSavedAddresses((prev) => prev.map((a) => ({ ...a, isPrimary: a.id === id })));
    } catch { /* silent */ }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!device || !addressValue) return;
    setSubmitting(true);
    setError('');
    try {
      let addressId = addressValue.id;
      if (!addressId) {
        const { data: address } = await addressApi.create({
          city: addressValue.city,
          street: addressValue.street,
          house: addressValue.house,
          ...(addressValue.district ? { district: addressValue.district } : {}),
          ...(addressValue.building ? { building: addressValue.building } : {}),
          ...(addressValue.floor ? { floor: addressValue.floor } : {}),
          ...(addressValue.apartment ? { apartment: addressValue.apartment } : {}),
          ...(addressValue.latitude != null ? { latitude: addressValue.latitude } : {}),
          ...(addressValue.longitude != null ? { longitude: addressValue.longitude } : {}),
        });
        addressId = address.id;
      }
      await userDeviceApi.update(device.id, { addressId });
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
          key={device?.id}
          value={addressValue}
          onChange={setAddressValue}
          label="Адрес установки"
          savedAddresses={savedAddresses}
          onSetPrimary={handleSetPrimary}
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
