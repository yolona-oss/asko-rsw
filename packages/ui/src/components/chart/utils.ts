import type { DateRange, RangePreset } from './types';

export function defaultRange(daysBack: number = 30): DateRange {
  const end = new Date();
  const start = new Date(end.getTime() - daysBack * 24 * 60 * 60 * 1000);
  return { start, end };
}

export function formatRangeLabel(range: DateRange | null): string {
  if (!range) return 'Все время';
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long' };
  const startStr = range.start.toLocaleDateString('ru-RU', opts);
  const endStr = range.end.toLocaleDateString('ru-RU', { ...opts, year: 'numeric' });
  return `С ${startStr} по ${endStr} г.`;
}

export function toInputDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export const DEFAULT_RANGE_PRESETS: RangePreset[] = [
  { key: '1h', label: '1ч', ms: 60 * 60 * 1000 },
  { key: '6h', label: '6ч', ms: 6 * 60 * 60 * 1000 },
  { key: '12h', label: '12ч', ms: 12 * 60 * 60 * 1000 },
  { key: '1d', label: '1д', ms: 24 * 60 * 60 * 1000 },
  { key: '7d', label: '7д', ms: 7 * 24 * 60 * 60 * 1000 },
  { key: '1m', label: '1м', ms: 30 * 24 * 60 * 60 * 1000 },
  { key: '1y', label: '1г', ms: 365 * 24 * 60 * 60 * 1000 },
];
