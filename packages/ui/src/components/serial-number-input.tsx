'use client'

import { type InputHTMLAttributes, forwardRef } from 'react';
import { PatternInput, type ValidationResult } from './pattern-input';

export interface SerialNumberInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'type' | 'pattern'> {
  error?: boolean;
  showValidation?: boolean;
  errorMessage?: string;
  /** Called with the full normalized serial (e.g. "SN-12345678") */
  onValueChange?: (raw: string) => void;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

function formatSerial(value: string): string {
  const cleaned = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  if (cleaned.length === 0) return '';
  const body = cleaned.startsWith('SN') ? cleaned.slice(2) : cleaned;
  return body.length === 0 ? 'SN-' : `SN-${body}`;
}

function extractSerial(value: string): string {
  return formatSerial(value);
}

function validateSerial(value: string): ValidationResult | null {
  if (!value || value === 'SN-') return null;
  const body = value.replace(/^SN-/, '').replace(/[^a-zA-Z0-9]/g, '');
  if (body.length === 0) {
    return { valid: false, hint: 'Введите серийный номер после SN-' };
  }
  if (body.length < 4) {
    return { valid: false, hint: 'Серийный номер слишком короткий' };
  }
  return { valid: true, hint: '' };
}

export const SerialNumberInput = forwardRef<HTMLInputElement, SerialNumberInputProps>(
  ({ showValidation = true, ...props }, ref) => (
    <PatternInput
      ref={ref}
      placeholder="SN-00000000"
      formatter={formatSerial}
      extractor={extractSerial}
      keyFilter={/^[a-zA-Z0-9]$/}
      focusValue="SN-"
      validator={validateSerial}
      showValidation={showValidation}
      showValidBorder
      {...props}
    />
  ),
);

SerialNumberInput.displayName = 'SerialNumberInput';
