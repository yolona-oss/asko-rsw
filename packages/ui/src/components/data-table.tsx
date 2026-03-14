import type { ReactNode } from 'react';
import { cn } from '../utils/cn';

export interface DataTableProps {
  className?: string;
  children: ReactNode;
}

export function DataTable({ className, children }: DataTableProps) {
  return (
    <div
      className={cn(
        'flex flex-col border border-border-light rounded-sm overflow-hidden',
        className,
      )}
    >
      {children}
    </div>
  );
}

export interface DataTableHeaderProps {
  className?: string;
  children: ReactNode;
}

export function DataTableHeader({ className, children }: DataTableHeaderProps) {
  return (
    <div
      className={cn(
        'hidden lg:flex items-center px-5 py-3 text-xs font-medium text-text-sub uppercase tracking-wider border-b border-border-light',
        className,
      )}
    >
      {children}
    </div>
  );
}

export interface DataTableRowProps {
  className?: string;
  children: ReactNode;
}

export function DataTableRow({ className, children }: DataTableRowProps) {
  return (
    <div
      className={cn(
        'flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-0 px-5 py-4 border-b border-border-light last:border-b-0 bg-white',
        className,
      )}
    >
      {children}
    </div>
  );
}

export interface DataTableCellProps {
  mobileLabel?: string;
  className?: string;
  children: ReactNode;
}

export function DataTableCell({ mobileLabel, className, children }: DataTableCellProps) {
  return (
    <div className={className}>
      {mobileLabel && (
        <p className="text-xs text-text-sub lg:hidden">{mobileLabel}</p>
      )}
      {children}
    </div>
  );
}

export interface DataTableEmptyProps {
  className?: string;
  children: ReactNode;
}

export function DataTableEmpty({ className, children }: DataTableEmptyProps) {
  return (
    <div className={cn('px-5 py-8 text-center text-sm text-text-sub', className)}>
      {children}
    </div>
  );
}
