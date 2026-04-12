import type { PatternRecordDto, ScheduleRecord } from '@/lib/api/schedule';
import type { RepairerScheduleInfo } from './types';

const MS_PER_DAY = 86_400_000;

function utcDayStart(d: Date): number {
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

function coversToday(entry: ScheduleRecord, todayStart: number): boolean {
  const from = utcDayStart(new Date(entry.dateFrom));
  const to = utcDayStart(new Date(entry.dateTo));
  return from <= todayStart && todayStart <= to;
}

export function resolveScheduleForToday(
  pattern: PatternRecordDto | null | undefined,
  entries?: ScheduleRecord[] | null,
): RepairerScheduleInfo {
  const todayStart = utcDayStart(new Date());

  const approvedToday = (entries ?? []).filter(
    (e) => e.status === 'approved' && coversToday(e, todayStart),
  );

  // EXTRA_DAY overrides vacation/sick — a manager-proposed, repairer-accepted
  // extra work day means the repairer is available today despite an overlapping
  // vacation. Check it first.
  const extra = approvedToday.find((e) => e.type === 'extra_day' || e.type === 'overtime');
  if (extra) {
    return { status: 'working', startTime: extra.startTime, endTime: extra.endTime };
  }

  const vacation = approvedToday.find((e) => e.type === 'vacation');
  if (vacation) return { status: 'vacation' };

  const sick = approvedToday.find((e) => e.type === 'sick_leave');
  if (sick) return { status: 'sick_leave' };

  if (!pattern || !pattern.slots?.length) {
    return { status: 'unknown' };
  }
  const anchor = new Date(pattern.anchorDate);
  const diffDays = Math.floor((todayStart - utcDayStart(anchor)) / MS_PER_DAY);
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
    if (s === 'off') return 2;
    if (s === 'sick_leave') return 3;
    return 4; // vacation
  };
  return rank(a.status) - rank(b.status);
}
