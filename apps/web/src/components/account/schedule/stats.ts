import { startOfDay, countDays, timeToMinutes } from '@asko/shared/client';
import type { ScheduleEntry } from './types';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function parseDate(s: string): Date {
  return new Date(s.slice(0, 10));
}

function overlaps(entry: ScheduleEntry, from: Date, to: Date): boolean {
  const entryFrom = parseDate(entry.dateFrom);
  const entryTo = parseDate(entry.dateTo);
  return entryFrom <= to && entryTo >= from;
}

export interface ScheduleStats {
  overtimeMinutes: number;
  overtimeLabel: string;
  extraDaysCount: number;
  vacationLabel: string | null;
  /** True when an approved EXTRA_DAY covers today — overrides vacation for display. */
  extraDayActive: boolean;
  /** Human label shown on the repairer dashboard when extra day is active. */
  extraDayActiveLabel: string | null;
}

export function computeStats(entries: ScheduleEntry[]): ScheduleStats {
  const now = startOfDay(new Date());
  const past30 = new Date(now.getTime() - 30 * MS_PER_DAY);
  const next30 = new Date(now.getTime() + 30 * MS_PER_DAY);

  let overtimeMinutes = 0;
  let extraDaysCount = 0;
  let activeVacation: ScheduleEntry | null = null;
  let nextVacation: ScheduleEntry | null = null;
  let activeExtraDay: ScheduleEntry | null = null;

  for (const entry of entries) {
    if (entry.status === 'rejected') continue;

    if (entry.type === 'overtime' && overlaps(entry, past30, now)) {
      const start = timeToMinutes(entry.startTime);
      const end = timeToMinutes(entry.endTime);
      if (end > start) overtimeMinutes += end - start;
    }

    if (entry.type === 'schedule_override' && overlaps(entry, now, next30)) {
      const from = parseDate(entry.dateFrom);
      const to = parseDate(entry.dateTo);
      extraDaysCount += countDays(from < now ? now : from, to > next30 ? next30 : to);
      // Only APPROVED extra day overrides display state — pending proposals don't count.
      if (entry.status === 'approved' && from <= now && to >= now) {
        activeExtraDay = entry;
      }
    }

    if (entry.type === 'vacation') {
      const from = parseDate(entry.dateFrom);
      const to = parseDate(entry.dateTo);
      if (from <= now && to >= now) {
        activeVacation = entry;
      } else if (from > now) {
        if (!nextVacation || parseDate(nextVacation.dateFrom) > from) {
          nextVacation = entry;
        }
      }
    }
  }

  const overtimeHours = Math.floor(overtimeMinutes / 60);
  const overtimeRestMin = overtimeMinutes % 60;
  const overtimeLabel =
    overtimeMinutes === 0
      ? '0ч'
      : overtimeRestMin === 0
        ? `${overtimeHours}ч`
        : `${overtimeHours}ч ${overtimeRestMin}м`;

  const extraDayActive = !!activeExtraDay;
  let extraDayActiveLabel: string | null = null;
  if (activeExtraDay) {
    const to = parseDate(activeExtraDay.dateTo);
    const daysLeft = countDays(now, to);
    extraDayActiveLabel = daysLeft > 1 ? `Сейчас доп. день, ещё ${daysLeft} дн.` : 'Сегодня доп. день';
  }

  let vacationLabel: string | null = null;
  if (activeVacation && !extraDayActive) {
    const to = parseDate(activeVacation.dateTo);
    const daysLeft = countDays(now, to);
    vacationLabel = `Сейчас, ещё ${daysLeft} дн.`;
  } else if (nextVacation) {
    const from = parseDate(nextVacation.dateFrom);
    const daysUntil = countDays(now, from) - 1;
    vacationLabel = daysUntil === 0 ? 'Завтра' : `Через ${daysUntil} дн.`;
  }

  return {
    overtimeMinutes,
    overtimeLabel,
    extraDaysCount,
    vacationLabel,
    extraDayActive,
    extraDayActiveLabel,
  };
}
