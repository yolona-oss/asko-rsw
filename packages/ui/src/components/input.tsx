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
          'w-full px-4 py-2.5 text-sm text-text-main bg-white',
          'border outline-none transition-colors',
          'placeholder:text-[#999]',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          error
            ? 'border-brand-red focus:border-brand-red'
            : 'border-border-light focus:border-text-main',
          className,
        )}
        {...props}
      />
    );
  },
);

Input.displayName = 'Input';
