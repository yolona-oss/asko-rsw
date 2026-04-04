'use client';

import { useState, useEffect } from 'react';
import { Modal, Button, FormField, Input, Select, Textarea } from '@asko/ui';
import { scheduleApi } from '@/lib/api/schedule';
import { TYPE_LABELS, DAY_LABELS } from './constants';

interface ScheduleFormModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  editItem?: any;
  defaultUserId?: string;
}

export function ScheduleFormModal({ open, onClose, onSaved, editItem, defaultUserId }: ScheduleFormModalProps) {
  const isEdit = !!editItem;
  const [type, setType] = useState('work');
  const [dayOfWeek, setDayOfWeek] = useState<string>('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('18:00');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && editItem) {
      setType(editItem.type ?? 'work');
      setDayOfWeek(editItem.dayOfWeek != null && editItem.dayOfWeek >= 0 ? String(editItem.dayOfWeek) : '');
      setDate(editItem.date ?? '');
      setStartTime(editItem.startTime ?? '09:00');
      setEndTime(editItem.endTime ?? '18:00');
      setNote(editItem.note ?? '');
    } else if (open) {
      setType('work');
      setDayOfWeek('');
      setDate('');
      setStartTime('09:00');
      setEndTime('18:00');
      setNote('');
    }
    setError('');
  }, [open, editItem]);

  const needsDate = type !== 'work';
  const needsDayOfWeek = type === 'work';

  const handleSubmit = async () => {
    setError('');
    setSaving(true);
    try {
      if (isEdit) {
        await scheduleApi.update(editItem.id, {
          type,
          dayOfWeek: needsDayOfWeek && dayOfWeek !== '' ? Number(dayOfWeek) : null,
          date: needsDate ? date || null : null,
          startTime,
          endTime,
          note: note || null,
        });
      } else {
        await scheduleApi.create({
          userId: editItem?.userId ?? defaultUserId ?? '',
          type,
          dayOfWeek: needsDayOfWeek && dayOfWeek !== '' ? Number(dayOfWeek) : undefined,
          date: needsDate ? date : undefined,
          startTime,
          endTime,
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
    <Modal open={open} onClose={onClose} className="w-full max-w-md p-6">
      <h2 className="text-lg font-medium text-text-main mb-4">
        {isEdit ? 'Редактировать расписание' : 'Создать расписание'}
      </h2>
      <div className="flex flex-col gap-4">
        <FormField label="Тип">
          <Select value={type} onChange={(e) => setType(e.target.value)}>
            {Object.entries(TYPE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </Select>
        </FormField>

        {needsDayOfWeek && (
          <FormField label="День недели">
            <Select value={dayOfWeek} onChange={(e) => setDayOfWeek(e.target.value)}>
              <option value="" disabled>
                Выбрать день
              </option>
              {DAY_LABELS.map((label, i) => (
                <option key={i} value={i}>
                  {label}
                </option>
              ))}
            </Select>
          </FormField>
        )}

        {needsDate && (
          <FormField label="Дата">
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </FormField>
        )}

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Начало">
            <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
          </FormField>
          <FormField label="Конец">
            <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
          </FormField>
        </div>

        <FormField label="Примечание">
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Необязательно" rows={2} />
        </FormField>

        {error && <p className="text-sm text-brand-red">{error}</p>}

        <div className="flex gap-3">
          <Button variant="primary" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Сохранение...' : isEdit ? 'Сохранить' : 'Создать'}
          </Button>
          <Button variant="secondary" onClick={onClose}>
            Отмена
          </Button>
        </div>
      </div>
    </Modal>
  );
}
