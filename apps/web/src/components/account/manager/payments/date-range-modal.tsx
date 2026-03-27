'use client';

import { useState, useEffect } from 'react';
import { Modal, Button, Input } from '@asko/ui';
import type { DateRange } from './types';
import { RANGE_PRESETS } from './constants';
import { toInputDate } from './utils';

export function DateRangeModal({
  open,
  onClose,
  range,
  onApply,
}: {
  open: boolean;
  onClose: () => void;
  range: DateRange;
  onApply: (range: DateRange) => void;
}) {
  const [startStr, setStartStr] = useState(toInputDate(range.start));
  const [endStr, setEndStr] = useState(toInputDate(range.end));
  const [activePreset, setActivePreset] = useState<string | null>('1m');

  useEffect(() => {
    if (open) {
      setStartStr(toInputDate(range.start));
      setEndStr(toInputDate(range.end));
    }
  }, [open, range]);

  const handlePreset = (preset: typeof RANGE_PRESETS[number]) => {
    const end = new Date();
    const start = new Date(end.getTime() - preset.ms);
    setStartStr(toInputDate(start));
    setEndStr(toInputDate(end));
    setActivePreset(preset.key);
  };

  const handleApply = () => {
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
    <Modal open={open} onClose={onClose}>
      <div className="flex flex-col gap-5 p-6 w-full sm:w-[400px]">
        <h2 className="text-lg font-medium text-text-main">Период</h2>

        {/* Presets */}
        <div className="flex flex-wrap gap-2">
          {RANGE_PRESETS.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => handlePreset(p)}
              className={`px-3 py-1.5 text-sm rounded-sm border transition-colors cursor-pointer ${
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
    </Modal>
  );
}
