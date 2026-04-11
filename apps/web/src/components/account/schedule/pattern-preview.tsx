'use client';

import type { PatternRecord } from './types';

interface PatternPreviewProps {
  pattern: PatternRecord | null;
  compact?: boolean;
}

export function PatternPreview({ pattern, compact = false }: PatternPreviewProps) {
  if (!pattern || !pattern.slots || pattern.slots.length === 0) {
    return <p className="text-sm text-text-sub">Шаблон не задан</p>;
  }

  const { slots, defaultStartTime, defaultEndTime } = pattern;
  const workCount = slots.filter((s) => s.work).length;
  const restCount = slots.length - workCount;

  return (
    <div className="flex flex-col gap-2">
      {!compact && (
        <p className="text-[11px] sm:text-[12px] text-text-sub">
          Цикл: {slots.length} дн. ({workCount} раб. / {restCount} вых.) — {defaultStartTime}–{defaultEndTime}
        </p>
      )}
      <div className="flex flex-nowrap gap-2 overflow-x-auto py-1 scrollbar-hide -mx-3 px-3 sm:-mx-0 sm:px-0">
        {slots.map((slot, i) => {
          const isWork = !!slot.work;
          const start = slot.startTime || defaultStartTime;
          const end = slot.endTime || defaultEndTime;
          const hasOverride = !!slot.startTime || !!slot.endTime;
          return (
            <div
              key={i}
              className={`w-[90px] sm:w-[110px] shrink-0 p-2 flex flex-col gap-0.5 border ${
                isWork
                  ? 'bg-success-bg border-success-border text-text-main'
                  : 'bg-surface-hover border-border-light text-text-sub'
              }`}
            >
              <span className="text-[10px] sm:text-[11px] font-semibold">День {i + 1}</span>
              {isWork ? (
                <>
                  <span className="text-[11px] sm:text-xs font-medium">{start} — {end}</span>
                  {hasOverride && <span className="text-[9px] sm:text-[10px] text-text-sub">Индив.</span>}
                </>
              ) : (
                <span className="text-[11px] sm:text-xs">Выходной</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function patternSummary(pattern: PatternRecord | null): string {
  if (!pattern || !pattern.slots || pattern.slots.length === 0) return 'Нет шаблона';
  const work = pattern.slots.filter((s) => s.work).length;
  const rest = pattern.slots.length - work;
  return `${work}/${rest} · ${pattern.defaultStartTime}–${pattern.defaultEndTime}`;
}
