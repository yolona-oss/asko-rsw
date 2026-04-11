'use client';

import { useState, useEffect } from 'react';
import { Modal, Button, FormField, Input, Select, Textarea } from '@asko/ui';
import { scheduleApi } from '@/lib/api/schedule';
import { TYPE_LABELS } from './constants';

interface ScheduleFormModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  editItem?: any;
  defaultUserId?: string;
  defaultType?: 'vacation' | 'sick_leave' | 'overtime' | 'extra_day';
  lockType?: boolean;
}

const EXCEPTION_TYPES = ['vacation', 'sick_leave', 'overtime', 'extra_day'] as const;

export function ScheduleFormModal({ open, onClose, onSaved, editItem, defaultUserId, defaultType, lockType }: ScheduleFormModalProps) {
  const isEdit = !!editItem;
  const [type, setType] = useState<string>(defaultType ?? 'vacation');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('18:00');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && editItem) {
      setType(editItem.type ?? 'vacation');
      setDateFrom((editItem.dateFrom ?? '').slice(0, 10));
      setDateTo((editItem.dateTo ?? '').slice(0, 10));
      setStartTime(editItem.startTime ?? '09:00');
      setEndTime(editItem.endTime ?? '18:00');
      setNote(editItem.note ?? '');
    } else if (open) {
      const today = new Date().toISOString().slice(0, 10);
      setType(defaultType ?? 'vacation');
      setDateFrom(today);
      setDateTo(today);
      setStartTime('09:00');
      setEndTime('18:00');
      setNote('');
    }
    setError('');
  }, [open, editItem, defaultType]);

  const isRange = type === 'vacation' || type === 'sick_leave';
  const needsTimes = type === 'overtime' || type === 'extra_day';

  const handleSubmit = async () => {
    setError('');
    if (!dateFrom) {
      setError('Укажите дату');
      return;
    }
    const effectiveTo = isRange ? (dateTo || dateFrom) : dateFrom;
    if (new Date(effectiveTo) < new Date(dateFrom)) {
      setError('Дата окончания раньше даты начала');
      return;
    }
    setSaving(true);
    try {
      if (isEdit) {
        await scheduleApi.update(editItem.id, {
          type,
          dateFrom,
          dateTo: effectiveTo,
          startTime: needsTimes ? startTime : '00:00',
          endTime: needsTimes ? endTime : '23:59',
          note: note || null,
        });
      } else if (type === 'vacation') {
        await scheduleApi.createVacation({
          userId: editItem?.userId ?? defaultUserId ?? '',
          dateFrom,
          dateTo: effectiveTo,
          note: note || undefined,
        });
      } else {
        await scheduleApi.create({
          userId: editItem?.userId ?? defaultUserId ?? '',
          type,
          dateFrom,
          dateTo: effectiveTo,
          startTime: needsTimes ? startTime : '00:00',
          endTime: needsTimes ? endTime : '23:59',
          note: note || undefined,
        });
      }
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} className="w-full max-w-md p-4 sm:p-6">
      <h2 className="text-base sm:text-lg font-medium text-text-main mb-4">
        {isEdit ? 'Редактировать запись' : 'Создать запись'}
      </h2>
      <div className="flex flex-col gap-3 sm:gap-4">
        <FormField label="Тип">
          <Select value={type} onChange={(e) => setType(e.target.value)} disabled={lockType}>
            {EXCEPTION_TYPES.map((k) => (
              <option key={k} value={k}>
                {TYPE_LABELS[k] ?? k}
              </option>
            ))}
          </Select>
        </FormField>

        {isRange ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <FormField label="С">
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </FormField>
            <FormField label="По">
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </FormField>
          </div>
        ) : (
          <FormField label="Дата">
            <Input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setDateTo(e.target.value); }} />
          </FormField>
        )}

        {needsTimes && (
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <FormField label="Начало">
              <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </FormField>
            <FormField label="Конец">
              <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </FormField>
          </div>
        )}

        <FormField label="Примечание">
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Необязательно" rows={2} />
        </FormField>

        {error && <p className="text-sm text-brand-red">{error}</p>}

        <div className="flex gap-2 sm:gap-3">
          <Button variant="primary" onClick={handleSubmit} disabled={saving} className="flex-1 sm:flex-none">
            {saving ? 'Сохранение...' : isEdit ? 'Сохранить' : 'Создать'}
          </Button>
          <Button variant="secondary" onClick={onClose} className="flex-1 sm:flex-none">
            Отмена
          </Button>
        </div>
      </div>
    </Modal>
  );
}
