import type { PatternRecordDto } from '@/lib/api/schedule';
import type { RepairerScheduleInfo } from './types';

const MS_PER_DAY = 86_400_000;

function utcDayStart(d: Date): number {
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

export function resolveScheduleForToday(pattern: PatternRecordDto | null | undefined): RepairerScheduleInfo {
  if (!pattern || !pattern.slots?.length) {
    return { status: 'unknown' };
  }
  const anchor = new Date(pattern.anchorDate);
  const now = new Date();
  const diffDays = Math.floor((utcDayStart(now) - utcDayStart(anchor)) / MS_PER_DAY);
  const len = pattern.cycleLength;
  const position = ((diffDays % len) + len) % len;
  const slot = pattern.slots[position];
  if (!slot) return { status: 'unknown' };
  if (!slot.work) return { status: 'off' };
  return {
    status: 'working',
    startTime: slot.startTime || pattern.defaultStartTime,
    endTime: slot.endTime || pattern.defaultEndTime,
  };
}

export function compareBySchedule(
  a: RepairerScheduleInfo,
  b: RepairerScheduleInfo,
): number {
  const rank = (s: RepairerScheduleInfo['status']): number => {
    if (s === 'working') return 0;
    if (s === 'unknown') return 1;
    return 2;
  };
  return rank(a.status) - rank(b.status);
}
