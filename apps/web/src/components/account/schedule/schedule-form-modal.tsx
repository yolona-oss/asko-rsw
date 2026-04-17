'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Modal, Button, FormField, Input, Select, Textarea } from '@asko/ui';
import { todayISO, combineDateTimeMs } from '@asko/shared/client';
import { scheduleApi } from '@/lib/api/schedule';
import { useAccount } from '@/components/account/layout/provider';
import { primaryRole } from '@/lib/account';
import { useFormGuard } from '@/hooks/use-form-guard';
import { EditedMark } from '@/components/shared/edited-mark';
import { TYPE_LABELS } from './constants';

interface ScheduleFormModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  editItem?: any;
  defaultUserId?: string;
  defaultType?: 'vacation' | 'sick_leave' | 'overtime' | 'schedule_override';
  lockType?: boolean;
}

const EXCEPTION_TYPES = ['vacation', 'sick_leave', 'overtime', 'schedule_override'] as const;

function isSameDay(a: string, b: string): boolean {
  return a.slice(0, 10) === b.slice(0, 10);
}

type ScheduleSnapshot = { type: string; dateFrom: string; dateTo: string; startTime: string; endTime: string; note: string };

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

  const [initialState, setInitialState] = useState<ScheduleSnapshot | undefined>(undefined);

  useEffect(() => {
    if (open && editItem) {
      const snap: ScheduleSnapshot = {
        type: editItem.type ?? 'vacation',
        dateFrom: (editItem.dateFrom ?? '').slice(0, 10),
        dateTo: (editItem.dateTo ?? '').slice(0, 10),
        startTime: editItem.startTime ?? '09:00',
        endTime: editItem.endTime ?? '18:00',
        note: editItem.note ?? '',
      };
      setType(snap.type);
      setDateFrom(snap.dateFrom);
      setDateTo(snap.dateTo);
      setStartTime(snap.startTime);
      setEndTime(snap.endTime);
      setNote(snap.note);
      setInitialState(snap);
    } else if (open) {
      const today = todayISO();
      const snap: ScheduleSnapshot = {
        type: defaultType ?? 'vacation',
        dateFrom: today,
        dateTo: today,
        startTime: '09:00',
        endTime: '18:00',
        note: '',
      };
      setType(snap.type);
      setDateFrom(snap.dateFrom);
      setDateTo(snap.dateTo);
      setStartTime(snap.startTime);
      setEndTime(snap.endTime);
      setNote(snap.note);
      setInitialState(snap);
    }
    setError('');
  }, [open, editItem, defaultType]);

  const formState = useMemo<ScheduleSnapshot>(
    () => ({ type, dateFrom, dateTo, startTime, endTime, note }),
    [type, dateFrom, dateTo, startTime, endTime, note],
  );

  const isRange = type === 'vacation' || type === 'sick_leave';
  const needsTimes = type === 'overtime' || type === 'schedule_override';

  const editBlockedReason = useMemo<string | null>(() => {
    if (!isEdit || !editItem) return null;
    const itemType = editItem.type as string;
    if (itemType === 'schedule_override') {
      if (!isSameDay(editItem.dateFrom ?? '', todayISO())) {
        return 'Дополнительный день можно изменить только в тот день, на который он создан';
      }
    }
    if (!isAdmin) {
      if (itemType !== 'vacation') {
        return 'Изменять можно только записи отпуска';
      }
      const startsAt = combineDateTimeMs(editItem.dateFrom ?? '', editItem.startTime ?? '00:00');
      if (startsAt <= Date.now()) {
        return 'Нельзя изменить запись отпуска после её начала';
      }
    }
    return null;
  }, [isEdit, editItem, isAdmin]);

  const createBlockedReason = useMemo<string | null>(() => {
    if (isEdit) return null;
    return null;
  }, [isEdit]);

  const handleApplyDraft = useCallback((data: ScheduleSnapshot) => {
    setType(data.type);
    setDateFrom(data.dateFrom);
    setDateTo(data.dateTo);
    setStartTime(data.startTime);
    setEndTime(data.endTime);
    setNote(data.note);
  }, []);

  const saveSchedule = useCallback(async () => {
    setError('');
    if (editBlockedReason) throw new Error(editBlockedReason);
    if (createBlockedReason) throw new Error(createBlockedReason);
    if (!dateFrom) throw new Error('Укажите дату');

    const effectiveTo = isRange ? (dateTo || dateFrom) : dateFrom;
    if (new Date(effectiveTo) < new Date(dateFrom)) throw new Error('Дата окончания раньше даты начала');

    const effectiveStart = needsTimes ? startTime : '00:00';
    if (type === 'schedule_override') {
      if (dateFrom !== todayISO()) throw new Error('Дополнительный день можно создать только на сегодня');
    } else if (type === 'overtime') {
      if (combineDateTimeMs(dateFrom, '00:00') < combineDateTimeMs(todayISO(), '00:00'))
        throw new Error('Нельзя создавать запись за прошедший день');
    } else if (type === 'sick_leave') {
      if (combineDateTimeMs(dateFrom, '00:00') < combineDateTimeMs(todayISO(), '00:00'))
        throw new Error('Нельзя создавать запись за прошедший день');
      const diffDays = (new Date(effectiveTo).getTime() - new Date(dateFrom).getTime()) / 86_400_000;
      if (diffDays > 30) throw new Error('Максимальная длительность больничного — 30 дней');
    } else if (combineDateTimeMs(dateFrom, effectiveStart) < Date.now()) {
      throw new Error('Нельзя создавать запись в прошлом');
    }

    const userId = editItem?.userId ?? defaultUserId ?? '';
    const durationDays = Math.max(1, Math.floor((new Date(effectiveTo).getTime() - new Date(dateFrom).getTime()) / 86_400_000) + 1);

    if (isEdit) {
      if (type === 'vacation') {
        await scheduleApi.updateVacation(editItem.id, { dateTo: effectiveTo, note: note || null });
      } else if (type === 'sick_leave') {
        await scheduleApi.updateSickLeave(editItem.id, { dateTo: effectiveTo, note: note || null });
      } else if (type === 'overtime') {
        await scheduleApi.updateOvertime(editItem.id, { startTime, endTime, note: note || null });
      } else {
        await scheduleApi.updateOverride(editItem.id, { startTime, endTime, note: note || null });
      }
    } else if (type === 'vacation') {
      await scheduleApi.createVacation({ userId, dateFrom, durationDays, note: note || undefined });
    } else if (type === 'sick_leave') {
      await scheduleApi.createSickLeave({ userId, dateFrom, durationDays, note: note || undefined });
    } else if (type === 'overtime') {
      await scheduleApi.createOvertime({ userId, date: dateFrom, startTime, endTime, note: note || undefined });
    } else {
      await scheduleApi.createOverride({ userId, date: dateFrom, startTime, endTime, note: note || undefined });
    }
  }, [type, dateFrom, dateTo, startTime, endTime, note, isEdit, editItem, defaultUserId, isRange, needsTimes, editBlockedReason, createBlockedReason]);

  const guard = useFormGuard<ScheduleSnapshot>({
    storageKey: `schedule-${editItem?.id || 'new'}`,
    currentState: formState,
    initialState,
    onSave: saveSchedule,
    onApplyDraft: handleApplyDraft,
  });

  const guardedOnClose = guard.guardedClose(onClose);

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await saveSchedule();
      guard.markSaved();
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err?.message ?? 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const availableTypes = EXCEPTION_TYPES;
  const typeSelectDisabled = !!lockType;
  const submitDisabled = saving || !!editBlockedReason || !!createBlockedReason;

  return (
    <Modal open={open} onClose={guardedOnClose} className="w-full max-w-md p-4 sm:p-6">
      <h2 className="text-base sm:text-lg font-medium text-text-main mb-4 flex items-center gap-3">
        {isEdit ? 'Редактировать запись' : 'Создать запись'}
        <EditedMark visible={guard.dirty} />
      </h2>
      <div className="flex flex-col gap-3 sm:gap-4">
        {editBlockedReason && (
          <p className="text-sm text-warning-deep bg-warning-bg border border-warning-border p-2">
            {editBlockedReason}
          </p>
        )}
        <FormField label="Тип">
          <Select value={type} onChange={(e) => {
            const v = e.target.value;
            setType(v);
            if (v === 'schedule_override') { setDateFrom(todayISO()); setDateTo(todayISO()); }
          }} disabled={typeSelectDisabled}>
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
              <Input
                type="date"
                min={dateFrom || todayISO()}
                max={type === 'sick_leave' ? (() => { const d = new Date(dateFrom || todayISO()); d.setDate(d.getDate() + 30); return d.toISOString().slice(0, 10); })() : undefined}
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </FormField>
          </div>
        ) : (
          <FormField label="Дата">
            <Input
              type="date"
              min={todayISO()}
              max={type === 'schedule_override' ? todayISO() : undefined}
              value={type === 'schedule_override' ? todayISO() : dateFrom}
              disabled={type === 'schedule_override'}
              onChange={(e) => { setDateFrom(e.target.value); setDateTo(e.target.value); }}
            />
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
          <Button variant="secondary" onClick={guardedOnClose} className="flex-1 sm:flex-none">
            Отмена
          </Button>
        </div>
      </div>

      {guard.guardDialog}
      {guard.draftDialog}
    </Modal>
  );
}
