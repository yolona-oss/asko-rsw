'use client';

import { useState, useEffect, useMemo } from 'react';
import { Modal, Button, FormField, Input, Select, Textarea } from '@asko/ui';
import { scheduleApi } from '@/lib/api/schedule';
import { useAccount } from '@/components/account/layout/provider';
import { primaryRole } from '@/lib/account';
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

function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function isSameDay(a: string, b: string): boolean {
  return a.slice(0, 10) === b.slice(0, 10);
}

function combineDateTime(dateIso: string, time: string): number {
  const d = dateIso.slice(0, 10);
  const [y, mo, da] = d.split('-').map(Number);
  const [h = 0, mi = 0] = (time || '00:00').split(':').map(Number);
  return new Date(y, (mo ?? 1) - 1, da ?? 1, h, mi, 0, 0).getTime();
}

export function ScheduleFormModal({ open, onClose, onSaved, editItem, defaultUserId, defaultType, lockType }: ScheduleFormModalProps) {
  const { user } = useAccount();
  const role = user ? primaryRole(user) : 'user';
  const isAdmin = role === 'admin';
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
      const today = todayISO();
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

  // Permission checks:
  // - Non-admins can only edit VACATION before its start.
  // - EXTRA_DAY can only be edited on its own calendar day (even by admins).
  // - Non-admins cannot create non-vacation types here.
  const editBlockedReason = useMemo<string | null>(() => {
    if (!isEdit || !editItem) return null;
    const itemType = editItem.type as string;
    if (itemType === 'extra_day') {
      if (!isSameDay(editItem.dateFrom ?? '', todayISO())) {
        return 'Дополнительный день можно изменить только в тот день, на который он создан';
      }
    }
    if (!isAdmin) {
      if (itemType !== 'vacation') {
        return 'Изменять можно только записи отпуска';
      }
      const startsAt = combineDateTime(editItem.dateFrom ?? '', editItem.startTime ?? '00:00');
      if (startsAt <= Date.now()) {
        return 'Нельзя изменить запись отпуска после её начала';
      }
    }
    return null;
  }, [isEdit, editItem, isAdmin]);

  const createBlockedReason = useMemo<string | null>(() => {
    if (isEdit) return null;
    if (!isAdmin && type !== 'vacation') {
      return 'Можно создавать только записи отпуска';
    }
    return null;
  }, [isEdit, isAdmin, type]);

  const handleSubmit = async () => {
    setError('');
    if (editBlockedReason) {
      setError(editBlockedReason);
      return;
    }
    if (createBlockedReason) {
      setError(createBlockedReason);
      return;
    }
    if (!dateFrom) {
      setError('Укажите дату');
      return;
    }
    const effectiveTo = isRange ? (dateTo || dateFrom) : dateFrom;
    if (new Date(effectiveTo) < new Date(dateFrom)) {
      setError('Дата окончания раньше даты начала');
      return;
    }
    // Strict: creation/edit must be for a moment in the future (server enforces too).
    const effectiveStart = needsTimes ? startTime : '00:00';
    if (combineDateTime(dateFrom, effectiveStart) < Date.now()) {
      setError('Нельзя создавать запись в прошлом');
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

  // Non-admins see only vacation in the type list (they can only create vacation entries).
  const availableTypes = isAdmin ? EXCEPTION_TYPES : (['vacation'] as const);
  const typeSelectDisabled = lockType || !isAdmin;
  const submitDisabled = saving || !!editBlockedReason || !!createBlockedReason;

  return (
    <Modal open={open} onClose={onClose} className="w-full max-w-md p-4 sm:p-6">
      <h2 className="text-base sm:text-lg font-medium text-text-main mb-4">
        {isEdit ? 'Редактировать запись' : 'Создать запись'}
      </h2>
      <div className="flex flex-col gap-3 sm:gap-4">
        {editBlockedReason && (
          <p className="text-sm text-warning-deep bg-warning-bg border border-warning-border p-2">
            {editBlockedReason}
          </p>
        )}
        <FormField label="Тип">
          <Select value={type} onChange={(e) => setType(e.target.value)} disabled={typeSelectDisabled}>
            {availableTypes.map((k) => (
              <option key={k} value={k}>
                {TYPE_LABELS[k] ?? k}
              </option>
            ))}
          </Select>
        </FormField>

        {isRange ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <FormField label="С">
              <Input type="date" min={todayISO()} value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </FormField>
            <FormField label="По">
              <Input type="date" min={dateFrom || todayISO()} value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </FormField>
          </div>
        ) : (
          <FormField label="Дата">
            <Input type="date" min={todayISO()} value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setDateTo(e.target.value); }} />
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
          <Button variant="primary" onClick={handleSubmit} disabled={submitDisabled} className="flex-1 sm:flex-none">
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
