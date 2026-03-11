import type { ReactNode } from 'react';
import { cn } from '../utils/cn';

export interface FormFieldProps {
  label?: string;
  htmlFor?: string;
  error?: string;
  className?: string;
  children: ReactNode;
}

export function FormField({ label, htmlFor, error, className, children }: FormFieldProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <label
          htmlFor={htmlFor}
          className="text-sm font-medium text-gray-700"
        >
          {label}
        </label>
      )}
      {children}
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
