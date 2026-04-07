import { cn } from '../utils/cn';

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
  activeLabel = 'Активен',
  inactiveLabel = 'Заблокирован',
  className,
}: StatusBadgeProps) {
  return (
    <span className={cn(
      'inline-block text-sm text-white px-2 py-0.5 rounded-[22px]',
      active ? 'bg-[#187f43]' : 'bg-[#a0a0a0]',
      className,
    )}>
      {active ? activeLabel : inactiveLabel}
    </span>
  );
}
