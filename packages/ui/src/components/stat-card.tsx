'use client';

import type { ReactNode } from 'react';
import { cn } from '../utils/cn';
import { useUiLocale } from '../locale';

export interface StatCardTrend {
  /** Percentage change (e.g. 12 for +12%, -5 for -5%) */
  value: number;
  /** Label after percentage (default: "за период") */
  label?: string;
}

export type StatCardSize = 'hero' | 'compact';

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
  /**
   * Typography scale.
   * - `hero` (default): big dashboard numbers (82px value, 24px title) — for user/dealer.
   * - `compact`: denser cards that fit tight grids (40px value, 16px title) — for admin/manager/repairer.
   */
  size?: StatCardSize;
  className?: string;
}

const sizeStyles: Record<StatCardSize, {
  container: string;
  title: string;
  value: string;
  subtitle: string;
  trend: string;
}> = {
  hero: {
    container: 'p-6 gap-2',
    title: 'text-[24px] font-normal leading-[28px] tracking-[-0.01em]',
    value: 'text-[82px] font-medium leading-[86px] tracking-[-0.01em]',
    subtitle: 'text-[14px] font-medium leading-[18px] tracking-[-0.01em]',
    trend: 'text-[14px] leading-[18px] tracking-[-0.01em]',
  },
  compact: {
    container: 'p-5 gap-1.5',
    title: 'text-[16px] font-normal leading-[20px] tracking-[-0.01em]',
    value: 'text-[40px] font-medium leading-[44px] tracking-[-0.01em] truncate',
    subtitle: 'text-[12px] font-medium leading-[16px] tracking-[-0.01em]',
    trend: 'text-[12px] leading-[16px] tracking-[-0.01em]',
  },
};

export function StatCard({
  title,
  value,
  subtitle,
  trend,
  icon,
  children,
  size = 'hero',
  className,
}: StatCardProps) {
  const locale = useUiLocale();
  const s = sizeStyles[size];
  return (
    <div className={cn(
      'bg-surface border border-border shadow-sm flex flex-col min-w-0',
      s.container,
      className,
    )}>
      <div className="flex items-start justify-between gap-2 min-w-0">
        <span className={cn(s.title, 'text-text-main min-w-0 truncate')}>{title}</span>
        {icon && <div className="text-text-sub flex-shrink-0">{icon}</div>}
      </div>
      <div className={cn(s.value, 'text-text-main min-w-0')}>
        {value}
      </div>
      {subtitle && (
        <div className={cn(s.subtitle, 'text-text-sub truncate')}>{subtitle}</div>
      )}
      {trend && (
        <p className={s.trend}>
          <span className={trend.value >= 0 ? 'text-success-deep' : 'text-brand-red'}>
            {trend.value >= 0 ? '+' : ''}{trend.value}%
          </span>
          <span className="text-text-sub"> {trend.label ?? locale.statPeriodLabel}</span>
        </p>
      )}
      {children}
    </div>
  );
}
