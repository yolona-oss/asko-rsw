'use client';

import type { Bucket } from './types';
import { formatAmount } from './utils';

export function ChartTooltip({ bucket, x, visible }: { bucket: Bucket | null; x: number; visible: boolean }) {
  if (!visible || !bucket) return null;
  return (
    <div
      className="absolute z-10 pointer-events-none bg-white border border-border-light shadow-md px-3 py-2 -translate-x-1/2 bottom-full mb-2 whitespace-nowrap"
      style={{ left: `${x}%` }}
    >
      <p className="text-xs font-medium text-text-main">{bucket.label}</p>
      <p className="text-xs text-text-sub">{formatAmount(bucket.total)} ₽</p>
      <p className="text-xs text-text-sub">{bucket.count} {bucket.count === 1 ? 'транзакция' : bucket.count < 5 ? 'транзакции' : 'транзакций'}</p>
    </div>
  );
}
