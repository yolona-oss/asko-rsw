'use client'

import { type InputHTMLAttributes, forwardRef } from 'react';
import { PatternInput } from './pattern-input';

export interface PhoneInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'type' | 'pattern'> {
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
  let digits = value.replace(/\D/g, '').slice(0, 11);
  // Auto-convert 8 → 7 as first digit (common Russian habit)
  if (digits.length === 1 && digits[0] === '8') {
    digits = '7';
  }
  return digits;
}

export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  (props, ref) => (
    <PatternInput
      ref={ref}
      type="tel"
      inputMode="tel"
      placeholder="+7 (___) ___-__-__"
      formatter={formatPhone}
      extractor={extractDigits}
      keyFilter={/^\d$/}
      focusValue="+7"
      {...props}
    />
  ),
);

PhoneInput.displayName = 'PhoneInput';
