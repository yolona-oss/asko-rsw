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
        'bg-white border border-[#eaeaea] shadow-[0px_10px_60px_0px_rgba(226,236,249,0.5)] overflow-hidden',
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
        'hidden lg:flex items-center bg-[#f6f6f8] border-b border-[#edeff1] px-6 py-2 text-sm text-[#323232]',
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
        'flex flex-col lg:flex-row lg:items-center gap-2 lg:gap-0 px-6 py-2.5 border-b border-[#edeff1] last:border-b-0 bg-white',
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
    <div className={cn('px-8 py-10 text-center text-sm text-text-sub', className)}>
      {children}
    </div>
  );
}

export interface DataTableFooterProps {
  className?: string;
  children: ReactNode;
}

export function DataTableFooter({ className, children }: DataTableFooterProps) {
  return (
    <div className={cn('px-6 py-2.5 text-sm text-[rgba(50,50,50,0.58)] tracking-[-0.14px]', className)}>
      {children}
    </div>
  );
}
