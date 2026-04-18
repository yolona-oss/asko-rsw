'use client'

import { type InputHTMLAttributes, forwardRef, useMemo } from 'react';
import { PatternInput, type ValidationResult } from './pattern-input';
import { useUiLocale } from '../locale';

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

function validateSerial(value: string, enterAfterPrefix: string, tooShort: string): ValidationResult | null {
  if (!value || value === 'SN-') return null;
  const body = value.replace(/^SN-/, '').replace(/[^a-zA-Z0-9]/g, '');
  if (body.length === 0) {
    return { valid: false, hint: enterAfterPrefix };
  }
  if (body.length < 4) {
    return { valid: false, hint: tooShort };
  }
  return { valid: true, hint: '' };
}

export const SerialNumberInput = forwardRef<HTMLInputElement, SerialNumberInputProps>(
  ({ showValidation = true, ...props }, ref) => {
    const locale = useUiLocale();
    const validator = useMemo(
      () => (value: string) => validateSerial(value, locale.serialEnterAfterPrefix, locale.serialTooShort),
      [locale],
    );
    return (
      <PatternInput
        ref={ref}
        placeholder="SN-00000000"
        formatter={formatSerial}
        extractor={extractSerial}
        keyFilter={/^[a-zA-Z0-9]$/}
        focusValue="SN-"
        validator={validator}
        showValidation={showValidation}
        showValidBorder
        {...props}
      />
    );
  },
);

SerialNumberInput.displayName = 'SerialNumberInput';
