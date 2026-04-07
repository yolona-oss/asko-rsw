import type { ReactNode } from 'react';
import { cn } from '../utils/cn';

export interface TabListProps {
  className?: string;
  children: ReactNode;
}

export function TabList({ className, children }: TabListProps) {
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {children}
    </div>
  );
}

export interface TabProps {
  active?: boolean;
  onClick?: () => void;
  className?: string;
  children: ReactNode;
}

export function Tab({ active, onClick, className, children }: TabProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'px-4 py-2 text-sm font-medium border transition-colors cursor-pointer',
        active
          ? 'bg-dark-deep text-text-on-dark border-dark-deep'
          : 'bg-surface text-text-main border-border-light hover:border-text-main',
        className,
      )}
    >
      {children}
    </button>
  );
}
