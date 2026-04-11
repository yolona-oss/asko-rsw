import type { ScheduleEntry } from './types';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function parseDate(s: string): Date {
  return new Date(s.slice(0, 10));
}

function dayStart(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function overlaps(entry: ScheduleEntry, from: Date, to: Date): boolean {
  const entryFrom = parseDate(entry.dateFrom);
  const entryTo = parseDate(entry.dateTo);
  return entryFrom <= to && entryTo >= from;
}

function countDays(from: Date, to: Date): number {
  return Math.floor((dayStart(to).getTime() - dayStart(from).getTime()) / MS_PER_DAY) + 1;
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

export interface ScheduleStats {
  overtimeMinutes: number;
  overtimeLabel: string;
  extraDaysCount: number;
  vacationLabel: string | null;
}

export function computeStats(entries: ScheduleEntry[]): ScheduleStats {
  const now = dayStart(new Date());
  const past30 = new Date(now.getTime() - 30 * MS_PER_DAY);
  const next30 = new Date(now.getTime() + 30 * MS_PER_DAY);

  let overtimeMinutes = 0;
  let extraDaysCount = 0;
  let activeVacation: ScheduleEntry | null = null;
  let nextVacation: ScheduleEntry | null = null;

  for (const entry of entries) {
    if (entry.status === 'rejected') continue;

    if (entry.type === 'overtime' && overlaps(entry, past30, now)) {
      const start = timeToMinutes(entry.startTime);
      const end = timeToMinutes(entry.endTime);
      if (end > start) overtimeMinutes += end - start;
    }

    if (entry.type === 'extra_day' && overlaps(entry, now, next30)) {
      const from = parseDate(entry.dateFrom);
      const to = parseDate(entry.dateTo);
      extraDaysCount += countDays(from < now ? now : from, to > next30 ? next30 : to);
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

  let vacationLabel: string | null = null;
  if (activeVacation) {
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
  };
}
