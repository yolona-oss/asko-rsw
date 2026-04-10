'use client';

import { useState } from 'react';
import { Button, FormField, Select, Input, Modal } from '@asko/ui';
import { certificateApi } from '@/lib/api/certificate';
import type { ICertificate } from '@/lib/api/types';

const DURATION_OPTIONS = [
  { value: 6, label: '6 месяцев' },
  { value: 12, label: '1 год' },
  { value: 24, label: '2 года' },
  { value: 36, label: '3 года' },
  { value: 60, label: '5 лет' },
];

export function CreateCertificateModal({
  open,
  userDeviceId,
  onClose,
  onSuccess,
}: {
  open: boolean;
  userDeviceId: string;
  onClose: () => void;
  onSuccess: (cert: ICertificate) => void;
}) {
  const [durationMonths, setDurationMonths] = useState<number>(12);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!userDeviceId) return;

    setSubmitting(true);
    setError('');
    try {
      const { data } = await certificateApi.selfCreate({
        userDeviceId,
        durationMonths,
        description: description.trim() || undefined,
      });
      setDescription('');
      setDurationMonths(12);
      onClose();
      onSuccess(data.certificate);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Не удалось создать сертификат');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-6 w-full sm:w-[420px]">
        <h2 className="text-xl font-medium text-text-main">Создать сертификат</h2>
        <p className="text-sm text-text-sub">
          Сертификат будет привязан к выбранному устройству. Стоимость зависит от срока действия и цены устройства.
          После создания сертификат нужно оплатить — сделать это можно сразу или позже.
        </p>

        <FormField label="Срок действия">
          <Select
            value={String(durationMonths)}
            onChange={(e) => setDurationMonths(Number(e.target.value))}
          >
            {DURATION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField label="Комментарий (необязательно)">
          <Input
            placeholder="Например: гарантия на замену"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </FormField>

        {error && <p className="text-sm text-brand-red">{error}</p>}

        <div className="flex gap-3 justify-end">
          <Button variant="secondary" type="button" onClick={onClose}>
            Отмена
          </Button>
          <Button variant="primary" type="submit" disabled={submitting || !userDeviceId}>
            {submitting ? 'Создание...' : 'Создать'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
