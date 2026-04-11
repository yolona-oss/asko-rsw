import type { ReactNode } from 'react';
import { cn } from '../utils/cn';

export interface StatCardTrend {
  /** Percentage change (e.g. 12 for +12%, -5 for -5%) */
  value: number;
  /** Label after percentage (default: "за период") */
  label?: string;
}

export interface StatCardProps {
  /** Small title above the value */
  title: string;
  /** Main display value (number, formatted string, or ReactNode) */
  value: ReactNode;
  /** Optional subtitle below the value */
  subtitle?: ReactNode;
  /** Optional trend indicator */
  trend?: StatCardTrend;
  /** Optional icon rendered at the top-right */
  icon?: ReactNode;
  /** Additional content below */
  children?: ReactNode;
  className?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  trend,
  icon,
  children,
  className,
}: StatCardProps) {
  return (
    <div className={cn(
      'bg-surface border border-border shadow-sm p-6 flex flex-col gap-2',
      className,
    )}>
      <div className="flex items-start justify-between gap-2">
        <span className="text-[24px] font-normal leading-[28px] tracking-[-0.01em] text-text-main">{title}</span>
        {icon && <div className="text-text-sub flex-shrink-0">{icon}</div>}
      </div>
      <div className="text-[82px] font-medium leading-[86px] tracking-[-0.01em] text-text-main">
        {value}
      </div>
      {subtitle && (
        <div className="text-[14px] font-medium leading-[18px] tracking-[-0.01em] text-text-sub">{subtitle}</div>
      )}
      {trend && (
        <p className="text-[14px] leading-[18px] tracking-[-0.01em]">
          <span className={trend.value >= 0 ? 'text-[#2D8B57]' : 'text-brand-red'}>
            {trend.value >= 0 ? '+' : ''}{trend.value}%
          </span>
          <span className="text-text-sub"> {trend.label ?? 'за период'}</span>
        </p>
      )}
      {children}
    </div>
  );
}
