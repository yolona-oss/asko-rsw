'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { Reorder } from 'framer-motion';
import { Button, Input, FormField, Select, SkeletonCard } from '@asko/ui';
import { todayISO, formatIsoDate } from '@asko/shared/client';
import { scheduleApi } from '@/lib/api/schedule';
import type { PatternRecord, PatternSlot } from './types';
import { PRESETS } from './constants';
import { SlotBlock, type SlotEntry } from './slot-block';
import { SlotPopover } from './slot-popover';
import { WeekProjection } from './week-projection';

interface PatternEditorProps {
  userId: string;
  onChanged?: () => void;
}

// Monday-first weekday options (getDay() returns 0=Sunday..6=Saturday).
const WEEKDAY_OPTIONS: { value: number; label: string }[] = [
  { value: 1, label: 'Пн' },
  { value: 2, label: 'Вт' },
  { value: 3, label: 'Ср' },
  { value: 4, label: 'Чт' },
  { value: 5, label: 'Пт' },
  { value: 6, label: 'Сб' },
  { value: 0, label: 'Вс' },
];

/**
 * Given a target weekday (0=Sun..6=Sat), return the ISO date of the most recent
 * occurrence of that weekday that is <= today. This keeps the pattern's first
 * work day anchored in the current or past week so the current week projection
 * is populated with cycle data.
 */
function mostRecentWeekdayOnOrBefore(weekday: number, reference = new Date()): string {
  const base = new Date(reference.getFullYear(), reference.getMonth(), reference.getDate());
  const diff = (base.getDay() - weekday + 7) % 7;
  base.setDate(base.getDate() - diff);
  return formatIsoDate(base);
}

/** Weekday (0..6) of the given ISO date, or null if invalid. */
function weekdayOf(isoDate: string): number | null {
  if (!isoDate) return null;
  const [y, m, d] = isoDate.slice(0, 10).split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d).getDay();
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

  const [initialSnapshot, setInitialSnapshot] = useState<{
    entries: SlotEntry[];
    defaultStart: string;
    defaultEnd: string;
    anchorDate: string;
  } | null>(null);

  const [popoverIndex, setPopoverIndex] = useState<number | null>(null);

  const [patternStatus, setPatternStatus] = useState<string | null>(null);
  const [hasPendingEdit, setHasPendingEdit] = useState(false);

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
        setDirty(true);
        setPatternStatus(null);
        setHasPendingEdit(false);
        return;
      }
      // Prefer the repairer's pending edit so they see their last proposed
      // version; fall back to the live approved pattern otherwise.
      const source = pattern.pendingData ?? pattern;
      const wrapped = wrap(
        source.slots.map((s) => ({
          work: !!s.work,
          startTime: s.startTime || null,
          endTime: s.endTime || null,
        })),
      );
      const snap = {
        entries: wrapped,
        defaultStart: source.defaultStartTime || DEFAULT_START,
        defaultEnd: source.defaultEndTime || DEFAULT_END,
        anchorDate: ((source as any).anchorDate || todayISO()).slice(0, 10),
      };
      setEntries(snap.entries);
      setDefaultStart(snap.defaultStart);
      setDefaultEnd(snap.defaultEnd);
      setAnchorDate(snap.anchorDate);
      setInitialSnapshot(snap);
      setDirty(false);
      setPatternStatus(pattern.status ?? null);
      setHasPendingEdit(!!pattern.pendingData);
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

  const handleWeekdayChange = (weekday: number) => {
    setAnchorDate(mostRecentWeekdayOnOrBefore(weekday));
    setDirty(true);
  };

  const selectedWeekday = weekdayOf(anchorDate);

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
  const projectionSlots = useMemo(() => entries.map((e) => e.slot), [entries]);

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        <SkeletonCard className="h-10 w-full max-w-md" />
        <SkeletonCard className="h-24 w-full" />
      </div>
    );
  }

  const statusBanner = (() => {
    if (patternStatus === 'pending') {
      return 'Ваш график ожидает подтверждения администратором.';
    }
    if (patternStatus === 'rejected' && !hasPendingEdit) {
      return 'Ваш график был отклонён. Внесите изменения и отправьте повторно.';
    }
    if (hasPendingEdit) {
      return 'Ваши изменения графика ожидают подтверждения. Действующий график пока сохраняется.';
    }
    return null;
  })();

  return (
    <div className="flex flex-col gap-4">
      {statusBanner && (
        <div className="p-3 bg-warning-bg border border-warning-border text-[12px] sm:text-[13px] text-warning-deep">
          {statusBanner}
        </div>
      )}
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 max-w-2xl">
        <FormField label="Начало (по умолчанию)">
          <Input type="time" value={defaultStart} onChange={(e) => handleDefaultStartChange(e.target.value)} />
        </FormField>
        <FormField label="Конец (по умолчанию)">
          <Input type="time" value={defaultEnd} onChange={(e) => handleDefaultEndChange(e.target.value)} />
        </FormField>
        <FormField label="Старт цикла (день недели)">
          <Select
            value={selectedWeekday ?? 1}
            onChange={(e) => handleWeekdayChange(Number(e.target.value))}
          >
            {WEEKDAY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </FormField>
      </div>

      {/* Day blocks */}
      <div>
        <p className="text-[11px] sm:text-[12px] text-text-sub mb-2">
          Цикл: {entries.length} дн. ({workCount} раб. / {restCount} вых.) — удерживайте <span className="inline-block align-middle">⋮⋮</span> и перетащите блок в нужное место
        </p>
        <Reorder.Group
          axis="x"
          values={entries}
          onReorder={handleReorder}
          className="flex flex-nowrap gap-2 overflow-x-auto py-2 -mx-4 px-4 lg:-mx-0 lg:px-0 scrollbar-hide touch-pan-y"
        >
          {entries.map((entry, i) => (
            <SlotBlock
              key={entry.uid}
              entry={entry}
              index={i}
              defaultStart={defaultStart}
              defaultEnd={defaultEnd}
              interactive
              onOpen={setPopoverIndex}
            />
          ))}
        </Reorder.Group>
      </div>

      {/* Weekly projection — shows how the cycle lands on the current calendar week */}
      {entries.length > 0 && (
        <WeekProjection
          slots={projectionSlots}
          anchorDate={anchorDate}
          defaultStartTime={defaultStart}
          defaultEndTime={defaultEnd}
        />
      )}

      {error && <p className="text-sm text-brand-red">{error}</p>}

      {/* Apply bar — full-bleed on mobile */}
      {dirty && (
        <div className="sticky bottom-0 bg-surface border-t border-border-light py-3 -mx-4 px-4 lg:-mx-8 lg:px-8 flex items-center gap-3 z-20">
          <Button variant="primary" onClick={apply} disabled={saving} className="flex-1 sm:flex-none">
            {saving ? 'Сохранение...' : 'Применить'}
          </Button>
          <Button variant="secondary" onClick={reset} disabled={saving} className="flex-1 sm:flex-none">
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
