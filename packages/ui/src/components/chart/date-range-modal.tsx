'use client';

import { useState } from 'react';
import { Modal } from '../modal';
import { Button } from '../button';
import { Input } from '../input';
import type { DateRange, RangePreset } from './types';
import { DEFAULT_RANGE_PRESETS, toInputDate } from './utils';
import { useUiLocale } from '../../locale';

export interface DateRangeModalProps {
  open: boolean;
  onClose: () => void;
  /** Current range, or null for "all time" */
  range: DateRange | null;
  /** Called with a DateRange or null (all time) */
  onApply: (range: DateRange | null) => void;
  /** Override default presets */
  presets?: RangePreset[];
  /** Modal title (default: "Период") */
  title?: string;
  /** Show "Все время" button (default: true) */
  showAllTime?: boolean;
}

export function DateRangeModal({
  open,
  onClose,
  range,
  onApply,
  presets = DEFAULT_RANGE_PRESETS,
  title,
  showAllTime = true,
}: DateRangeModalProps) {
  const locale = useUiLocale();
  return (
    <Modal open={open} onClose={onClose}>
      {open && (
        <DateRangeForm
          range={range}
          onApply={onApply}
          onClose={onClose}
          presets={presets}
          title={title ?? locale.chartPeriodTitle}
          showAllTime={showAllTime}
        />
      )}
    </Modal>
  );
}

function DateRangeForm({
  range,
  onApply,
  onClose,
  presets,
  title,
  showAllTime,
}: {
  range: DateRange | null;
  onApply: (range: DateRange | null) => void;
  onClose: () => void;
  presets: RangePreset[];
  title: string;
  showAllTime: boolean;
}) {
  const [startStr, setStartStr] = useState(() => range ? toInputDate(range.start) : '');
  const [endStr, setEndStr] = useState(() => range ? toInputDate(range.end) : '');
  const [activePreset, setActivePreset] = useState<string | null>(range ? null : 'all');

  const handlePreset = (preset: RangePreset) => {
    const end = new Date();
    const start = new Date(end.getTime() - preset.ms);
    setStartStr(toInputDate(start));
    setEndStr(toInputDate(end));
    setActivePreset(preset.key);
  };

  const handleAllTime = () => {
    setStartStr('');
    setEndStr('');
    setActivePreset('all');
  };

  const handleApply = () => {
    if (activePreset === 'all') {
      onApply(null);
      onClose();
      return;
    }
    const start = new Date(startStr);
    const end = new Date(endStr);
    if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && start < end) {
      end.setHours(23, 59, 59, 999);
      onApply({ start, end });
      onClose();
    }
  };

  const handleSetNow = () => {
    setEndStr(toInputDate(new Date()));
    setActivePreset(null);
  };

  return (
    <div className="flex flex-col gap-5 p-6 w-full sm:w-[400px]">
      <h2 className="text-lg font-medium text-text-main">{title}</h2>

      {/* Presets */}
      <div className="flex flex-wrap gap-2">
        {showAllTime && (
          <button
            type="button"
            onClick={handleAllTime}
            className={`px-3 py-1.5 text-sm border transition-colors cursor-pointer ${
              activePreset === 'all'
                ? 'border-brand-red bg-brand-red/5 text-brand-red font-medium'
                : 'border-border-light text-text-main hover:border-text-sub'
            }`}
          >
            Все
          </button>
        )}
        {presets.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => handlePreset(p)}
            className={`px-3 py-1.5 text-sm border transition-colors cursor-pointer ${
              activePreset === p.key
                ? 'border-brand-red bg-brand-red/5 text-brand-red font-medium'
                : 'border-border-light text-text-main hover:border-text-sub'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Custom range */}
      <div className="flex gap-3">
        <div className="flex-1 flex flex-col gap-1">
          <label className="text-xs text-text-sub">Начало</label>
          <Input
            type="date"
            value={startStr}
            onChange={(e) => { setStartStr(e.target.value); setActivePreset(null); }}
          />
        </div>
        <div className="flex-1 flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <label className="text-xs text-text-sub">Конец</label>
            <button
              type="button"
              onClick={handleSetNow}
              className="text-xs text-brand-red hover:underline cursor-pointer"
            >
              Сейчас
            </button>
          </div>
          <Input
            type="date"
            value={endStr}
            onChange={(e) => { setEndStr(e.target.value); setActivePreset(null); }}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        <Button variant="secondary" onClick={onClose}>Отмена</Button>
        <Button variant="primary" onClick={handleApply}>Применить</Button>
      </div>
    </div>
  );
}
