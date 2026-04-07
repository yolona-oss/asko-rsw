'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import type { ChartBucket } from './types';
import { ChartTooltip } from './chart-tooltip';

export interface BarChartProps {
  buckets: ChartBucket[];
  color: string;
  /** Height in px (default 120) */
  height?: number;
  /** Custom tooltip render */
  renderTooltip?: (bucket: ChartBucket) => ReactNode;
  /** Format tooltip value */
  formatValue?: (value: number) => string;
  /** Suffix after value in tooltip */
  valueSuffix?: string;
  /** Called when a bucket is clicked */
  onBucketClick?: (bucket: ChartBucket, index: number) => void;
}

export function BarChart({
  buckets,
  color,
  height = 120,
  renderTooltip,
  formatValue,
  valueSuffix,
  onBucketClick,
}: BarChartProps) {
  const max = Math.max(...buckets.map((b) => b.total), 1);
  const showEvery = buckets.length > 15 ? Math.ceil(buckets.length / 10) : 1;
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <div className="flex flex-col gap-1 w-full">
      <div className="relative flex items-end gap-[2px]" style={{ height }}>
        <ChartTooltip
          bucket={hovered !== null ? buckets[hovered] : null}
          x={hovered !== null && buckets.length > 0 ? ((hovered + 0.5) / buckets.length) * 100 : 0}
          visible={hovered !== null}
          renderContent={renderTooltip}
          formatValue={formatValue}
          valueSuffix={valueSuffix}
        />
        {buckets.map((b, i) => (
          <div
            key={i}
            className={`flex-1 min-w-0 transition-all ${onBucketClick ? 'cursor-pointer' : 'cursor-default'}`}
            onClick={() => onBucketClick?.(b, i)}
            style={{
              height: `${Math.max((b.total / max) * 100, b.total > 0 ? 4 : 0)}%`,
              backgroundColor: color,
              opacity: hovered !== null && hovered !== i ? 0.4 : 1,
            }}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          />
        ))}
      </div>
      <div className="flex gap-[2px]">
        {buckets.map((b, i) => (
          <div key={i} className="flex-1 min-w-0 text-center overflow-hidden">
            {i % showEvery === 0 ? (
              <span className="text-[9px] text-text-sub leading-none whitespace-nowrap">{b.label}</span>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
