'use client';

import type { ReactNode } from 'react';
import type { ChartBucket } from './types';

export interface ChartTooltipProps {
  bucket: ChartBucket | null;
  x: number;
  visible: boolean;
  /** Custom render for tooltip content. Receives the bucket. */
  renderContent?: (bucket: ChartBucket) => ReactNode;
  /** Format the value. Default: toLocaleString('ru-RU') */
  formatValue?: (value: number) => string;
  /** Suffix after the formatted value (e.g. ' ₽') */
  valueSuffix?: string;
}

export function ChartTooltip({
  bucket,
  x,
  visible,
  renderContent,
  formatValue = (v) => v.toLocaleString('ru-RU'),
  valueSuffix = '',
}: ChartTooltipProps) {
  if (!visible || !bucket) return null;

  return (
    <div
      className="absolute z-10 pointer-events-none bg-white border border-border-light shadow-md px-3 py-2 -translate-x-1/2 bottom-full mb-2 whitespace-nowrap"
      style={{ left: `${x}%` }}
    >
      {renderContent ? (
        renderContent(bucket)
      ) : (
        <>
          <p className="text-xs font-medium text-text-main">{bucket.label}</p>
          <p className="text-xs text-text-sub">{formatValue(bucket.total)}{valueSuffix}</p>
          {bucket.count > 0 && (
            <p className="text-xs text-text-sub">{bucket.count}</p>
          )}
        </>
      )}
    </div>
  );
}
