'use client';

import type { PatternPending, PatternRecord, PatternSlot } from './types';
import { WeekProjection } from './week-projection';

interface PatternPreviewProps {
  pattern: PatternRecord | null;
  compact?: boolean;
}

interface SlotGridProps {
  slots: PatternSlot[];
  defaultStartTime: string;
  defaultEndTime: string;
}

interface CycleBlockProps {
  slots: PatternSlot[];
  anchorDate: string;
  defaultStartTime: string;
  defaultEndTime: string;
  weekLabel?: string;
}

function CycleBlock({ slots, anchorDate, defaultStartTime, defaultEndTime, weekLabel }: CycleBlockProps) {
  return (
    <div className="flex flex-col gap-3">
      <SlotGrid slots={slots} defaultStartTime={defaultStartTime} defaultEndTime={defaultEndTime} />
      <WeekProjection
        slots={slots}
        anchorDate={anchorDate}
        defaultStartTime={defaultStartTime}
        defaultEndTime={defaultEndTime}
        label={weekLabel}
      />
    </div>
  );
}

function SlotGrid({ slots, defaultStartTime, defaultEndTime }: SlotGridProps) {
  return (
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
  );
}

function summaryLine(slots: PatternSlot[], defaultStart: string, defaultEnd: string): string {
  const workCount = slots.filter((s) => s.work).length;
  const restCount = slots.length - workCount;
  return `Цикл: ${slots.length} дн. (${workCount} раб. / ${restCount} вых.) — ${defaultStart}–${defaultEnd}`;
}

export function PatternPreview({ pattern, compact = false }: PatternPreviewProps) {
  if (!pattern || !pattern.slots || pattern.slots.length === 0) {
    // Brand-new PENDING row with no live slots.
    if (pattern?.pendingData) {
      return (
        <div className="flex flex-col gap-2">
          {!compact && (
            <p className="text-[11px] sm:text-[12px] text-warning-deep">
              Новый график на рассмотрении
            </p>
          )}
          <CycleBlock
            slots={pattern.pendingData.slots}
            anchorDate={pattern.pendingData.anchorDate}
            defaultStartTime={pattern.pendingData.defaultStartTime}
            defaultEndTime={pattern.pendingData.defaultEndTime}
          />
        </div>
      );
    }
    return <p className="text-sm text-text-sub">Шаблон не задан</p>;
  }

  const pending: PatternPending | null | undefined = pattern.pendingData;
  const isLivePending = pattern.status === 'pending' || pattern.status === 'rejected';

  return (
    <div className="flex flex-col gap-3">
      {!compact && (
        <p className="text-[11px] sm:text-[12px] text-text-sub">
          {summaryLine(pattern.slots, pattern.defaultStartTime, pattern.defaultEndTime)}
          {isLivePending && <span className="text-warning-deep"> — на рассмотрении</span>}
        </p>
      )}
      <CycleBlock
        slots={pattern.slots}
        anchorDate={pattern.anchorDate}
        defaultStartTime={pattern.defaultStartTime}
        defaultEndTime={pattern.defaultEndTime}
      />
      {pending && (
        <div className="flex flex-col gap-2 p-3 border border-warning-border bg-warning-bg">
          <p className="text-[11px] sm:text-[12px] text-warning-deep font-medium">
            Предложенные изменения
          </p>
          {!compact && (
            <p className="text-[11px] sm:text-[12px] text-text-sub">
              {summaryLine(pending.slots, pending.defaultStartTime, pending.defaultEndTime)}
            </p>
          )}
          <CycleBlock
            slots={pending.slots}
            anchorDate={pending.anchorDate}
            defaultStartTime={pending.defaultStartTime}
            defaultEndTime={pending.defaultEndTime}
            weekLabel="Эта неделя (после изменений)"
          />
        </div>
      )}
    </div>
  );
}

export function patternSummary(pattern: PatternRecord | null): string {
  if (!pattern) return 'Нет шаблона';
  const hasLive = pattern.slots && pattern.slots.length > 0;
  if (!hasLive && pattern.pendingData) {
    const work = pattern.pendingData.slots.filter((s) => s.work).length;
    const rest = pattern.pendingData.slots.length - work;
    return `${work}/${rest} · ${pattern.pendingData.defaultStartTime}–${pattern.pendingData.defaultEndTime} · на рассмотрении`;
  }
  if (!hasLive) return 'Нет шаблона';
  const work = pattern.slots.filter((s) => s.work).length;
  const rest = pattern.slots.length - work;
  const suffix = pattern.pendingData
    ? ' · есть изменения'
    : pattern.status === 'pending'
      ? ' · на рассмотрении'
      : '';
  return `${work}/${rest} · ${pattern.defaultStartTime}–${pattern.defaultEndTime}${suffix}`;
}
