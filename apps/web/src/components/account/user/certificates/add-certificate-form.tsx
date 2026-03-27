'use client';

import { useState, useEffect } from 'react';
import {
  Button,
  Input,
  FormField,
  Select,
  Modal,
} from '@asko/ui';
import { certificateApi } from '@/lib/api/certificate';
import { userDeviceApi } from '@/lib/api/user-device';
import type { ICertificate } from '@/lib/api/types';
import type { UserDevice } from './types';

export function AddCertificateForm({
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
    userDeviceApi
      .getMy()
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
      const { data: newCert } = await certificateApi.add({
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
