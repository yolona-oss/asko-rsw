import { cn } from '../utils/cn';

export type ProgressBarSize = 'sm' | 'md' | 'lg';

export interface ProgressBarProps {
  /** Progress value 0-100 */
  value: number;
  /** Bar color (default: brand-red) */
  color?: string;
  /** Background color (default: #f1f1f1) */
  bgColor?: string;
  /** Height variant */
  size?: ProgressBarSize;
  /** Label shown above the bar */
  label?: string;
  /** Show percentage text on the right */
  showValue?: boolean;
  className?: string;
}

const sizeStyles: Record<ProgressBarSize, string> = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3',
};

export function ProgressBar({
  value,
  color,
  bgColor,
  size = 'md',
  label,
  showValue,
  className,
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      {(label || showValue) && (
        <div className="flex items-center justify-between text-xs text-text-sub">
          {label && <span>{label}</span>}
          {showValue && <span>{Math.round(clamped)}%</span>}
        </div>
      )}
      <div className={cn('w-full overflow-hidden', sizeStyles[size])} style={{ backgroundColor: bgColor ?? '#f1f1f1' }}>
        <div
          className={cn('h-full transition-all duration-300')}
          style={{ width: `${clamped}%`, backgroundColor: color ?? '#EB001C' }}
        />
      </div>
    </div>
  );
}
