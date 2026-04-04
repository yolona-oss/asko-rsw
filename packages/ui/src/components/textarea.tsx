import { type TextareaHTMLAttributes, forwardRef } from 'react';
import { cn } from '../utils/cn';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ error, className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          'w-full px-4 py-2.5 text-sm text-text-main bg-white',
          'border outline-none transition-colors resize-none',
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

Textarea.displayName = 'Textarea';
