'use client';

import { forwardRef, useCallback, useMemo } from 'react';
import { PatternInput } from '@asko/ui';
import type { ValidationResult } from '@asko/ui';

export type CredentialType = 'email' | 'phone' | null;

export function detectCredentialType(value: string): CredentialType {
  if (!value) return null;
  const stripped = value.replace(/[\s()\-+]/g, '');
  if (!stripped) return null;
  return /^\d+$/.test(stripped) ? 'phone' : 'email';
}

/* ── Phone formatting ── */

function formatPhone(raw: string): string {
  const d = raw.replace(/\D/g, '');
  if (!d) return '';
  let r = '+' + d[0];
  if (d.length > 1) r += ' (' + d.substring(1, 4);
  if (d.length >= 4) r += ')';
  if (d.length > 4) r += ' ' + d.substring(4, 7);
  if (d.length > 7) r += '-' + d.substring(7, 9);
  if (d.length > 9) r += '-' + d.substring(9, 11);
  return r;
}

function extractPhone(display: string): string {
  return display.replace(/\D/g, '');
}

/* ── Validators ── */

function validatePhone(value: string): ValidationResult | null {
  const d = value.replace(/\D/g, '');
  if (!d) return null;
  if (d.length < 11) return { valid: false, hint: 'Введите полный номер телефона' };
  return { valid: true, hint: '' };
}

function validateEmail(value: string): ValidationResult | null {
  if (!value) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return { valid: false, hint: 'Введите корректный email' };
  return { valid: true, hint: '' };
}

/* ── Component ── */

interface CredentialInputProps {
  value: string;
  onChange: (value: string, type: CredentialType) => void;
  error?: boolean;
  required?: boolean;
  className?: string;
}

export const CredentialInput = forwardRef<HTMLInputElement, CredentialInputProps>(
  function CredentialInput({ value, onChange, error, required, className }, ref) {
    const type = useMemo(() => detectCredentialType(value), [value]);

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value;

        // First character: if digit or +, seed as phone
        if (!value && raw) {
          const firstChar = raw.trim();
          if (/^[\d+]/.test(firstChar)) {
            let d = raw.replace(/\D/g, '');
            if (d === '8') d = '7';
            const phoneVal = d ? `+${d}` : '+7';
            onChange(phoneVal, 'phone');
            return;
          }
        }

        onChange(raw, detectCredentialType(raw));
      },
      [onChange, value],
    );

    const isPhone = type === 'phone';

    return (
      <PatternInput
        ref={ref}
        value={value}
        onChange={handleChange}
        placeholder="Email или телефон"
        formatter={isPhone ? formatPhone : undefined}
        extractor={isPhone ? extractPhone : undefined}
        validator={isPhone ? validatePhone : type === 'email' ? validateEmail : undefined}
        showValidation
        error={error}
        required={required}
        className={className}
        autoComplete="username"
      />
    );
  },
);
