import type { ReactNode } from 'react';
import { cn } from '../utils/cn';

export interface DetailRowProps {
  label: string;
  value: ReactNode;
  className?: string;
}

export function DetailRow({ label, value, className }: DetailRowProps) {
  return (
    <div className={cn('flex justify-between gap-4 py-2 border-b border-border-light last:border-b-0', className)}>
      <span className="text-sm text-text-sub flex-shrink-0">{label}</span>
      <span className="text-sm text-text-main text-right">{value}</span>
    </div>
  );
}
