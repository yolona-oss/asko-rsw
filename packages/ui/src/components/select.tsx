import { type SelectHTMLAttributes, forwardRef } from 'react';
import { cn } from '../utils/cn';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ error, className, children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={cn(
          'w-full px-4 py-2.5 text-sm text-text-main bg-surface',
          'border outline-none transition-colors appearance-none',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          error
            ? 'border-brand-red focus:border-brand-red'
            : 'border-border-light focus:border-text-main',
          className,
        )}
        {...props}
      >
        {children}
      </select>
    );
  },
);

Select.displayName = 'Select';
