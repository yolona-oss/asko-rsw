'use client'

import { type InputHTMLAttributes, forwardRef, useCallback } from 'react';
import { cn } from '../utils/cn';

export interface PhoneInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'type'> {
  error?: boolean;
  /** Called with the raw digits (e.g. "79001234567") */
  onValueChange?: (raw: string) => void;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 11);

  if (digits.length === 0) return '';
  if (digits.length <= 1) return `+${digits}`;
  if (digits.length <= 4) return `+${digits[0]} (${digits.slice(1)}`;
  if (digits.length <= 7)
    return `+${digits[0]} (${digits.slice(1, 4)}) ${digits.slice(4)}`;
  if (digits.length <= 9)
    return `+${digits[0]} (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  return `+${digits[0]} (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9, 11)}`;
}

function extractDigits(value: string): string {
  return value.replace(/\D/g, '').slice(0, 11);
}

export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ error, className, value, onValueChange, onChange, onFocus, ...props }, ref) => {
    const rawDigits = typeof value === 'string' ? extractDigits(value) : '';
    const displayValue = typeof value === 'string' ? formatPhone(value) : '';

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        let digits = extractDigits(e.target.value);

        // Auto-prepend 7 if user types 8 as first digit (common Russian habit)
        if (digits.length === 1 && digits[0] === '8') {
          digits = '7';
        }

        // If empty or starting fresh, let it be
        const formatted = formatPhone(digits);

        // Update the input value for controlled components
        e.target.value = formatted;
        onChange?.(e);
        onValueChange?.(digits);
      },
      [onChange, onValueChange],
    );

    const handleFocus = useCallback(
      (e: React.FocusEvent<HTMLInputElement>) => {
        // Auto-fill +7 prefix on focus if empty
        if (!rawDigits) {
          const formatted = '+7';
          e.target.value = formatted;
          onChange?.(e as any);
          onValueChange?.('7');
        }
        onFocus?.(e);
      },
      [rawDigits, onChange, onValueChange, onFocus],
    );

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLInputElement>) => {
        // Allow: backspace, delete, tab, escape, enter, arrows
        const allowed = [
          'Backspace',
          'Delete',
          'Tab',
          'Escape',
          'Enter',
          'ArrowLeft',
          'ArrowRight',
          'Home',
          'End',
        ];
        if (allowed.includes(e.key)) return;

        // Allow Ctrl/Cmd + A, C, V, X
        if ((e.ctrlKey || e.metaKey) && ['a', 'c', 'v', 'x'].includes(e.key.toLowerCase())) return;

        // Only allow digits
        if (!/^\d$/.test(e.key)) {
          e.preventDefault();
        }
      },
      [],
    );

    return (
      <input
        ref={ref}
        type="tel"
        inputMode="tel"
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        placeholder="+7 (___) ___-__-__"
        className={cn(
          'w-full px-4 py-2.5 text-sm text-text-main bg-white',
          'border rounded-sm outline-none transition-colors',
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

PhoneInput.displayName = 'PhoneInput';
