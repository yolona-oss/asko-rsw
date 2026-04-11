import type { ReactNode } from 'react';
import { cn } from '../utils/cn';

export interface DonutSegment {
  value: number;
  color: string;
  label: string;
}

export interface DonutChartProps {
  segments: DonutSegment[];
  /** Diameter in px (default 120) */
  size?: number;
  /** Stroke width in px (default 20) */
  thickness?: number;
  /** Content rendered in the center (e.g. total number) */
  centerContent?: ReactNode;
  /** Show legend below the chart */
  showLegend?: boolean;
  className?: string;
}

export function DonutChart({
  segments,
  size = 120,
  thickness = 20,
  centerContent,
  showLegend,
  className,
}: DonutChartProps) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  if (total === 0) {
    return (
      <div className={cn('flex flex-col items-center gap-3', className)}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle
            cx={size / 2} cy={size / 2} r={(size - thickness) / 2}
            fill="none" stroke="var(--color-border)" strokeWidth={thickness}
          />
        </svg>
      </div>
    );
  }

  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className={cn('flex flex-col items-center gap-3', className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
          {segments.map((seg, i) => {
            const pct = seg.value / total;
            const dashLen = pct * circumference;
            const dashOffset = -offset;
            offset += dashLen;
            return (
              <circle
                key={i}
                cx={size / 2} cy={size / 2} r={radius}
                fill="none"
                stroke={seg.color}
                strokeWidth={thickness}
                strokeDasharray={`${dashLen} ${circumference - dashLen}`}
                strokeDashoffset={dashOffset}
                strokeLinecap="butt"
              />
            );
          })}
        </svg>
        {centerContent && (
          <div className="absolute inset-0 flex items-center justify-center">
            {centerContent}
          </div>
        )}
      </div>
      {showLegend && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 justify-center">
          {segments.map((seg, i) => (
            <div key={i} className="flex items-center gap-1.5 text-xs text-text-sub">
              <span className="w-2.5 h-2.5 flex-shrink-0" style={{ backgroundColor: seg.color }} />
              <span>{seg.label}</span>
              <span className="text-text-main font-medium">{seg.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
