import { type InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '../utils/cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ error, className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          'block w-full rounded-lg border px-3 py-2 text-sm',
          'bg-white text-gray-900 placeholder:text-gray-400',
          'transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-offset-0',
          error
            ? 'border-red-500 focus:ring-red-500'
            : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          className,
        )}
        {...props}
      />
    );
  },
);

Input.displayName = 'Input';
