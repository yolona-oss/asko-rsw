import { cn } from '../utils/cn';

export interface SparklineProps {
  /** Data points (raw numbers) */
  data: number[];
  /** Line color (default: #323232) */
  color?: string;
  /** Width in px (default 80) */
  width?: number;
  /** Height in px (default 24) */
  height?: number;
  /** Show area fill below the line */
  fill?: boolean;
  className?: string;
}

export function Sparkline({
  data,
  color = '#323232',
  width = 80,
  height = 24,
  fill,
  className,
}: SparklineProps) {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const padding = 1;

  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * (width - padding * 2) + padding;
      const y = height - padding - ((v - min) / range) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(' ');

  const areaPoints = `${padding},${height - padding} ${points} ${width - padding},${height - padding}`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn('inline-block', className)}
    >
      {fill && (
        <polygon points={areaPoints} fill={color} opacity={0.1} />
      )}
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
