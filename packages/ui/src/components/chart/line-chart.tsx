'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import type { ChartBucket } from './types';
import { ChartTooltip } from './chart-tooltip';

export interface LineChartProps {
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
}

export function LineChart({
  buckets,
  color,
  height = 120,
  renderTooltip,
  formatValue,
  valueSuffix,
}: LineChartProps) {
  const max = Math.max(...buckets.map((b) => b.total), 1);
  const showEvery = buckets.length > 15 ? Math.ceil(buckets.length / 10) : 1;
  const h = height;
  const w = buckets.length > 1 ? buckets.length - 1 : 1;
  const [hovered, setHovered] = useState<number | null>(null);

  const points = buckets
    .map((b, i) => {
      const x = (i / w) * 100;
      const y = h - (b.total / max) * h;
      return `${x},${y}`;
    })
    .join(' ');

  const areaPoints = `0,${h} ${points} 100,${h}`;

  const hoveredX = hovered !== null ? (hovered / w) * 100 : 0;
  const hoveredY = hovered !== null ? h - (buckets[hovered].total / max) * h : 0;

  return (
    <div className="flex flex-col gap-1 w-full">
      <div className="relative">
        <ChartTooltip
          bucket={hovered !== null ? buckets[hovered] : null}
          x={hoveredX}
          visible={hovered !== null}
          renderContent={renderTooltip}
          formatValue={formatValue}
          valueSuffix={valueSuffix}
        />
        <svg viewBox={`0 0 100 ${h}`} preserveAspectRatio="none" className="w-full" style={{ height: h }}>
          <polygon points={areaPoints} fill={color} opacity={0.1} />
          <polyline
            points={points}
            fill="none"
            stroke={color}
            strokeWidth={1.5}
            vectorEffect="non-scaling-stroke"
          />
          {hovered !== null && (
            <circle cx={hoveredX} cy={hoveredY} r={3} fill={color} vectorEffect="non-scaling-stroke" />
          )}
          {buckets.map((_, i) => {
            const x = (i / w) * 100;
            const barW = 100 / buckets.length;
            return (
              <rect
                key={i}
                x={x - barW / 2}
                y={0}
                width={barW}
                height={h}
                fill="transparent"
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                className="cursor-pointer"
              />
            );
          })}
        </svg>
      </div>
      <div className="flex">
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
