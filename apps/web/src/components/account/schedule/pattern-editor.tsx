'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { Reorder } from 'framer-motion';
import { Button, Input, FormField, SkeletonCard } from '@asko/ui';
import { scheduleApi } from '@/lib/api/schedule';
import type { PatternRecord, PatternSlot } from './types';
import { PRESETS } from './constants';
import { SlotBlock } from './slot-block';
import { SlotPopover } from './slot-popover';

interface PatternEditorProps {
  userId: string;
  onChanged?: () => void;
}

interface SlotEntry {
  uid: string;
  slot: PatternSlot;
}

function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

function makeUid(): string {
  return Math.random().toString(36).slice(2, 10);
}

function wrap(slots: PatternSlot[]): SlotEntry[] {
  return slots.map((s) => ({ uid: makeUid(), slot: s }));
}

function unwrap(entries: SlotEntry[]): PatternSlot[] {
  return entries.map((e) => ({
    work: !!e.slot.work,
    startTime: e.slot.startTime || null,
    endTime: e.slot.endTime || null,
  }));
}

const DEFAULT_START = '09:00';
const DEFAULT_END = '18:00';

export function PatternEditor({ userId, onChanged }: PatternEditorProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [defaultStart, setDefaultStart] = useState(DEFAULT_START);
  const [defaultEnd, setDefaultEnd] = useState(DEFAULT_END);
  const [anchorDate, setAnchorDate] = useState(todayISO());
  const [entries, setEntries] = useState<SlotEntry[]>([]);
  const [dirty, setDirty] = useState(false);

  // Snapshot for reset
  const [initialSnapshot, setInitialSnapshot] = useState<{
    entries: SlotEntry[];
    defaultStart: string;
    defaultEnd: string;
    anchorDate: string;
  } | null>(null);

  const [popoverIndex, setPopoverIndex] = useState<number | null>(null);

  const applySnapshot = useCallback(
    (pattern: PatternRecord | null) => {
      if (!pattern || !pattern.id) {
        const initial = wrap(PRESETS[0].slots);
        const snapshot = { entries: initial, defaultStart: DEFAULT_START, defaultEnd: DEFAULT_END, anchorDate: todayISO() };
        setEntries(snapshot.entries);
        setDefaultStart(snapshot.defaultStart);
        setDefaultEnd(snapshot.defaultEnd);
        setAnchorDate(snapshot.anchorDate);
        setInitialSnapshot(snapshot);
        setDirty(true); // No saved pattern — editor starts dirty so Apply saves it.
        return;
      }
      const wrapped = wrap(
        pattern.slots.map((s) => ({
          work: !!s.work,
          startTime: s.startTime || null,
          endTime: s.endTime || null,
        })),
      );
      const snap = {
        entries: wrapped,
        defaultStart: pattern.defaultStartTime || DEFAULT_START,
        defaultEnd: pattern.defaultEndTime || DEFAULT_END,
        anchorDate: (pattern.anchorDate || todayISO()).slice(0, 10),
      };
      setEntries(snap.entries);
      setDefaultStart(snap.defaultStart);
      setDefaultEnd(snap.defaultEnd);
      setAnchorDate(snap.anchorDate);
      setInitialSnapshot(snap);
      setDirty(false);
    },
    [],
  );

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const { data } = await scheduleApi.patternGet(userId);
      applySnapshot(data);
    } catch {
      applySnapshot(null);
    } finally {
      setLoading(false);
    }
  }, [userId, applySnapshot]);

  useEffect(() => {
    load();
  }, [load]);

  const applyPreset = (slots: PatternSlot[]) => {
    setEntries(wrap(slots));
    setDirty(true);
  };

  const handleReorder = (next: SlotEntry[]) => {
    setEntries(next);
    setDirty(true);
  };

  const handleSlotSave = (index: number, slot: PatternSlot) => {
    setEntries((prev) => prev.map((e, i) => (i === index ? { ...e, slot } : e)));
    setDirty(true);
  };

  const handleDefaultStartChange = (v: string) => {
    setDefaultStart(v);
    setDirty(true);
  };

  const handleDefaultEndChange = (v: string) => {
    setDefaultEnd(v);
    setDirty(true);
  };

  const handleAnchorChange = (v: string) => {
    setAnchorDate(v);
    setDirty(true);
  };

  const reset = () => {
    if (!initialSnapshot) return;
    setEntries(initialSnapshot.entries);
    setDefaultStart(initialSnapshot.defaultStart);
    setDefaultEnd(initialSnapshot.defaultEnd);
    setAnchorDate(initialSnapshot.anchorDate);
    setDirty(false);
    setError('');
  };

  const apply = async () => {
    setError('');
    const slots = unwrap(entries);
    if (slots.length === 0) {
      setError('Цикл должен содержать хотя бы один день');
      return;
    }
    if (!slots.some((s) => s.work)) {
      setError('Добавьте хотя бы один рабочий день');
      return;
    }
    setSaving(true);
    try {
      await scheduleApi.patternUpsert(userId, {
        cycleLength: slots.length,
        anchorDate,
        defaultStartTime: defaultStart,
        defaultEndTime: defaultEnd,
        slots,
      });
      await load();
      onChanged?.();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const workCount = useMemo(() => entries.filter((e) => e.slot.work).length, [entries]);
  const restCount = entries.length - workCount;

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        <SkeletonCard className="h-10 w-full max-w-md" />
        <SkeletonCard className="h-24 w-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Preset bar */}
      <div>
        <p className="text-[12px] text-text-sub mb-2">Шаблоны</p>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((preset) => (
            <Button
              key={preset.label}
              size="sm"
              variant="secondary"
              onClick={() => applyPreset(preset.slots)}
            >
              {preset.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Defaults */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl">
        <FormField label="Начало (по умолчанию)">
          <Input type="time" value={defaultStart} onChange={(e) => handleDefaultStartChange(e.target.value)} />
        </FormField>
        <FormField label="Конец (по умолчанию)">
          <Input type="time" value={defaultEnd} onChange={(e) => handleDefaultEndChange(e.target.value)} />
        </FormField>
        <FormField label="Старт цикла">
          <Input type="date" value={anchorDate} onChange={(e) => handleAnchorChange(e.target.value)} />
        </FormField>
      </div>

      {/* Day blocks */}
      <div>
        <p className="text-[12px] text-text-sub mb-2">
          Цикл: {entries.length} дн. ({workCount} раб. / {restCount} вых.) — перетащите блоки, чтобы изменить порядок
        </p>
        <Reorder.Group
          axis="x"
          values={entries}
          onReorder={handleReorder}
          className="flex flex-nowrap gap-2 overflow-x-auto py-2 -mx-4 px-4 scrollbar-hide"
        >
          {entries.map((entry, i) => (
            <SlotBlock
              key={entry.uid}
              slot={entry.slot}
              index={i}
              defaultStart={defaultStart}
              defaultEnd={defaultEnd}
              interactive
              onOpen={setPopoverIndex}
            />
          ))}
        </Reorder.Group>
      </div>

      {error && <p className="text-sm text-brand-red">{error}</p>}

      {/* Apply bar */}
      {dirty && (
        <div className="sticky bottom-0 bg-white border-t border-gray-200 py-3 -mx-4 px-4 flex items-center gap-3 z-20">
          <Button variant="primary" onClick={apply} disabled={saving}>
            {saving ? 'Сохранение...' : 'Применить'}
          </Button>
          <Button variant="secondary" onClick={reset} disabled={saving}>
            Сбросить
          </Button>
        </div>
      )}

      <SlotPopover
        open={popoverIndex !== null}
        index={popoverIndex ?? 0}
        slot={popoverIndex !== null ? entries[popoverIndex]?.slot ?? null : null}
        defaultStart={defaultStart}
        defaultEnd={defaultEnd}
        onClose={() => setPopoverIndex(null)}
        onSave={(slot) => popoverIndex !== null && handleSlotSave(popoverIndex, slot)}
      />
    </div>
  );
}
