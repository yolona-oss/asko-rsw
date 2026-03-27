'use client';

import { useState } from 'react';
import type { Bucket } from './types';
import { ChartTooltip } from './chart-tooltip';

export function BarChart({ buckets, color }: { buckets: Bucket[]; color: string }) {
  const max = Math.max(...buckets.map((b) => b.total), 1);
  const showEvery = buckets.length > 15 ? Math.ceil(buckets.length / 10) : 1;
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <div className="flex flex-col gap-1 w-full">
      <div className="relative flex items-end gap-[2px] h-[120px]">
        <ChartTooltip
          bucket={hovered !== null ? buckets[hovered] : null}
          x={hovered !== null && buckets.length > 0 ? ((hovered + 0.5) / buckets.length) * 100 : 0}
          visible={hovered !== null}
        />
        {buckets.map((b, i) => (
          <div
            key={i}
            className="flex-1 min-w-0 rounded-t-sm transition-all cursor-pointer"
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
