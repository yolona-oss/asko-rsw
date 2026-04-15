import type { PaymentRecord } from '@/lib/api/payment';
import type { ChartBucket, DateRange } from '@asko/ui';

export { defaultRange, formatRangeLabel, toInputDate } from '@asko/ui';
export {
  formatPaymentDate as formatDateFull,
  formatPaymentAmount as formatAmount,
} from '@/components/account/payments/shared/payment-constants';

export function payerName(user?: PaymentRecord['user']) {
  if (!user) return '-';
  return [user.lastName, user.firstName].filter(Boolean).join(' ') || user.email || '-';
}

export function bucketPayments(
  payments: PaymentRecord[],
  range: DateRange,
): ChartBucket[] {
  const rangeMs = range.end.getTime() - range.start.getTime();

  let bucketMs: number;
  let labelFn: (d: Date) => string;

  if (rangeMs <= 6 * 60 * 60 * 1000) {
    bucketMs = 30 * 60 * 1000;
    labelFn = (d) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  } else if (rangeMs <= 24 * 60 * 60 * 1000) {
    bucketMs = 60 * 60 * 1000;
    labelFn = (d) => `${String(d.getHours()).padStart(2, '0')}:00`;
  } else if (rangeMs <= 7 * 24 * 60 * 60 * 1000) {
    bucketMs = 6 * 60 * 60 * 1000;
    labelFn = (d) => `${d.getDate()} ${d.toLocaleDateString('ru-RU', { month: 'short' })}`;
  } else if (rangeMs <= 60 * 24 * 60 * 60 * 1000) {
    bucketMs = 24 * 60 * 60 * 1000;
    labelFn = (d) => `${d.getDate()} ${d.toLocaleDateString('ru-RU', { month: 'short' })}`;
  } else {
    bucketMs = 7 * 24 * 60 * 60 * 1000;
    labelFn = (d) => `${d.getDate()} ${d.toLocaleDateString('ru-RU', { month: 'short' })}`;
  }

  const buckets: ChartBucket[] = [];
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

  for (const p of payments) {
    const ts = new Date(p.paidAt || p.createdAt).getTime();
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
