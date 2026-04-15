'use client';

import { useState, useEffect } from 'react';
import { Button, FormField, Select, Input, Modal, SkeletonBlock } from '@asko/ui';
import { CERTIFICATE_DURATION_OPTIONS, CERTIFICATE_DURATION_LABELS } from '@asko/shared/client';
import { certificateApi } from '@/lib/api/certificate';
import type { ICertificate } from '@/lib/api/types';

const priceFormatter = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
  maximumFractionDigits: 0,
});

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
  const [price, setPrice] = useState<number | null>(null);
  const [priceLoading, setPriceLoading] = useState(false);

  useEffect(() => {
    if (!open || !userDeviceId || !durationMonths) {
      setPrice(null);
      return;
    }
    setPriceLoading(true);
    const handle = setTimeout(() => {
      certificateApi
        .calculatePrice(userDeviceId, durationMonths)
        .then(({ data }) => setPrice(data.price))
        .catch(() => setPrice(null))
        .finally(() => setPriceLoading(false));
    }, 200);
    return () => {
      clearTimeout(handle);
      setPriceLoading(false);
    };
  }, [open, userDeviceId, durationMonths]);

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
            {CERTIFICATE_DURATION_OPTIONS.map((months) => (
              <option key={months} value={months}>
                {CERTIFICATE_DURATION_LABELS[months]}
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
          <Button variant="primary" type="submit" disabled={submitting || !userDeviceId}>
            {submitting ? 'Создание...' : 'Создать'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
