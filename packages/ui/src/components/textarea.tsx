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
          'block w-full rounded-lg border px-3 py-2 text-sm',
          'bg-white text-gray-900 placeholder:text-gray-400',
          'transition-colors resize-y min-h-[80px]',
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

Textarea.displayName = 'Textarea';
