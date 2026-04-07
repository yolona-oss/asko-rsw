import { cn } from '../utils/cn';

export interface MetricComparisonItem {
  label: string;
  value: number;
  color?: string;
}

export interface MetricComparisonProps {
  items: MetricComparisonItem[];
  /** Format the value for display (default: toLocaleString('ru-RU')) */
  formatValue?: (value: number) => string;
  /** Show percentage of max next to value */
  showPercentage?: boolean;
  className?: string;
}

export function MetricComparison({
  items,
  formatValue = (v) => v.toLocaleString('ru-RU'),
  showPercentage,
  className,
}: MetricComparisonProps) {
  const max = Math.max(...items.map((i) => i.value), 1);

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {items.map((item, i) => {
        const pct = (item.value / max) * 100;
        const barColor = item.color ?? '#323232';
        return (
          <div key={i} className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-sub">{item.label}</span>
              <span className="text-text-main font-medium">
                {formatValue(item.value)}
                {showPercentage && (
                  <span className="text-text-sub font-normal ml-1">({Math.round(pct)}%)</span>
                )}
              </span>
            </div>
            <div className="w-full h-2 bg-surface-secondary overflow-hidden">
              <div
                className="h-full transition-all duration-300"
                style={{ width: `${pct}%`, backgroundColor: barColor }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
