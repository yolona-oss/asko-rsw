'use client';

import { startOfDay } from '@asko/shared/client';
import type { PatternSlot } from './types';

const MS_PER_DAY = 86_400_000;
const WEEKDAY_SHORT = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
const WEEK_ORDER_MON_FIRST = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

function startOfWeekMon(d: Date): Date {
  const base = startOfDay(d);
  const day = base.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  base.setDate(base.getDate() + diff);
  return base;
}

export function weekdayRu(isoDate: string): string {
  if (!isoDate) return '';
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return '';
  return WEEKDAY_SHORT[d.getDay()];
}

export function resolveSlot(
  slots: PatternSlot[],
  anchorDate: string,
  date: Date,
): PatternSlot | null {
  if (!slots || slots.length === 0 || !anchorDate) return null;
  const anchor = new Date(anchorDate);
  if (Number.isNaN(anchor.getTime())) return null;
  const anchorStart = startOfDay(anchor);
  const target = startOfDay(date);
  const diffDays = Math.floor((target.getTime() - anchorStart.getTime()) / MS_PER_DAY);
  const len = slots.length;
  const position = ((diffDays % len) + len) % len;
  return slots[position] ?? { work: false };
}

interface WeekProjectionProps {
  slots: PatternSlot[];
  anchorDate: string;
  defaultStartTime: string;
  defaultEndTime: string;
  label?: string;
}

export function WeekProjection({
  slots,
  anchorDate,
  defaultStartTime,
  defaultEndTime,
  label = 'Эта неделя',
}: WeekProjectionProps) {
  const today = startOfDay(new Date());
  const weekStart = startOfWeekMon(today);

  const days = WEEK_ORDER_MON_FIRST.map((dayLabel, i) => {
    const date = new Date(weekStart);
    date.setDate(date.getDate() + i);
    const slot = resolveSlot(slots, anchorDate, date);
    const isToday = date.getTime() === today.getTime();
    return {
      dayLabel,
      dateNum: date.getDate(),
      isToday,
      work: !!slot?.work,
      start: slot?.startTime || defaultStartTime,
      end: slot?.endTime || defaultEndTime,
      hasOverride: !!slot?.startTime || !!slot?.endTime,
      resolved: slot !== null,
    };
  });

  return (
    <div>
      <p className="text-[11px] sm:text-[12px] text-text-sub mb-2">{label}</p>
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {days.map((d, i) => {
          const base = 'p-1.5 sm:p-2 flex flex-col items-center gap-0.5 border';
          const tone = !d.resolved
            ? 'bg-surface-hover border-border-light text-text-sub'
            : d.work
              ? 'bg-success-bg border-success-border text-text-main'
              : 'bg-surface-hover border-border-light text-text-sub';
          const todayRing = d.isToday ? 'outline outline-2 outline-brand-red' : '';
          return (
            <div key={i} className={`${base} ${tone} ${todayRing}`}>
              <span className={`text-[10px] sm:text-[11px] font-semibold ${d.isToday ? 'text-brand-red' : ''}`}>
                {d.dayLabel}
              </span>
              <span className="text-[9px] sm:text-[10px] leading-none">{d.dateNum}</span>
              {!d.resolved ? (
                <span className="text-[9px] sm:text-[10px]">—</span>
              ) : d.work ? (
                <span className="text-[9px] sm:text-[10px] font-medium leading-tight">
                  {d.start}–{d.end}
                </span>
              ) : (
                <span className="text-[9px] sm:text-[10px]">Вых.</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
