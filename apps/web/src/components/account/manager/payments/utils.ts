import type { PaymentRecord } from '@/lib/api/payment';
import type { DateRange, Bucket } from './types';

export function defaultRange(): DateRange {
  const end = new Date();
  const start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
  return { start, end };
}

export function formatDateFull(dateStr: Date | string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function formatAmount(amount: number) {
  return amount.toLocaleString('ru-RU');
}

export function formatRangeLabel(range: DateRange) {
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

export function payerName(user?: PaymentRecord['user']) {
  if (!user) return '-';
  return [user.lastName, user.firstName].filter(Boolean).join(' ') || user.email || '-';
}

export function bucketPayments(
  payments: PaymentRecord[],
  range: DateRange,
): Bucket[] {
  const rangeMs = range.end.getTime() - range.start.getTime();

  // Determine bucket size
  let bucketMs: number;
  let labelFn: (d: Date) => string;

  if (rangeMs <= 6 * 60 * 60 * 1000) {
    // ≤6h: 30min buckets
    bucketMs = 30 * 60 * 1000;
    labelFn = (d) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  } else if (rangeMs <= 24 * 60 * 60 * 1000) {
    // ≤1d: 1h buckets
    bucketMs = 60 * 60 * 1000;
    labelFn = (d) => `${String(d.getHours()).padStart(2, '0')}:00`;
  } else if (rangeMs <= 7 * 24 * 60 * 60 * 1000) {
    // ≤7d: 6h buckets
    bucketMs = 6 * 60 * 60 * 1000;
    labelFn = (d) => `${d.getDate()} ${d.toLocaleDateString('ru-RU', { month: 'short' })}`;
  } else if (rangeMs <= 60 * 24 * 60 * 60 * 1000) {
    // ≤60d: 1d buckets
    bucketMs = 24 * 60 * 60 * 1000;
    labelFn = (d) => `${d.getDate()} ${d.toLocaleDateString('ru-RU', { month: 'short' })}`;
  } else {
    // >60d: 7d buckets
    bucketMs = 7 * 24 * 60 * 60 * 1000;
    labelFn = (d) => `${d.getDate()} ${d.toLocaleDateString('ru-RU', { month: 'short' })}`;
  }

  // Create buckets
  const buckets: Bucket[] = [];
  let t = range.start.getTime();
  while (t < range.end.getTime()) {
    const bEnd = Math.min(t + bucketMs, range.end.getTime());
    buckets.push({
      start: new Date(t),
      end: new Date(bEnd),
      total: 0,
      count: 0,
      label: labelFn(new Date(t)),
    });
    t += bucketMs;
  }

  // Fill buckets
  for (const p of payments) {
    const ts = new Date(p.paidAt ?? p.createdAt).getTime();
    if (ts < range.start.getTime() || ts > range.end.getTime()) continue;
    const idx = Math.min(
      Math.floor((ts - range.start.getTime()) / bucketMs),
      buckets.length - 1,
    );
    if (idx >= 0 && idx < buckets.length) {
      buckets[idx].total += p.amount;
      buckets[idx].count += 1;
    }
  }

  return buckets;
}
