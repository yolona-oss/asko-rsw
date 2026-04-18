'use client';

import { cn } from '../utils/cn';
import { useUiLocale } from '../locale';

export interface StatusBadgeProps {
  /** Whether the status is active/positive */
  active: boolean;
  /** Label for active state (default: "Активен") */
  activeLabel?: string;
  /** Label for inactive state (default: "Заблокирован") */
  inactiveLabel?: string;
  className?: string;
}

export function StatusBadge({
  active,
  activeLabel,
  inactiveLabel,
  className,
}: StatusBadgeProps) {
  const locale = useUiLocale();
  return (
    <span className={cn(
      'inline-block text-sm text-text-on-dark px-2 py-0.5 rounded-[22px]',
      active ? 'bg-success-deep' : 'bg-text-muted',
      className,
    )}>
      {active ? (activeLabel ?? locale.statusActive) : (inactiveLabel ?? locale.statusInactive)}
    </span>
  );
}
