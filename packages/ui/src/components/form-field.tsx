import type { ReactNode } from 'react';
import { cn } from '../utils/cn';

export interface FormFieldProps {
  label?: string;
  htmlFor?: string;
  error?: string;
  variant?: 'default' | 'bold';
  className?: string;
  children: ReactNode;
}

const labelStyles = {
  default: 'text-sm font-medium text-text-sub',
  bold: 'text-base lg:text-lg font-bold text-text-main',
} as const;

export function FormField({
  label,
  htmlFor,
  error,
  variant = 'default',
  className,
  children,
}: FormFieldProps) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {label && (
        <label htmlFor={htmlFor} className={labelStyles[variant]}>
          {label}
        </label>
      )}
      {children}
      {error && <p className="text-sm text-brand-red">{error}</p>}
    </div>
  );
}
