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
          'block w-full rounded-lg border px-3 py-2 text-sm appearance-none',
          'bg-white text-gray-900',
          'transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-offset-0',
          error
            ? 'border-red-500 focus:ring-red-500'
            : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500',
          'disabled:opacity-50 disabled:cursor-not-allowed',
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
