'use client';

import { forwardRef, useCallback } from 'react';
import { EmailInput, PhoneInput, PatternInput } from '@asko/ui';

export type CredentialType = 'email' | 'phone' | null;

export function detectCredentialType(value: string): CredentialType {
  if (!value) return null;
  const stripped = value.replace(/[\s()\-+]/g, '');
  if (!stripped) return value.includes('+') ? 'phone' : null;
  return /^\d+$/.test(stripped) ? 'phone' : 'email';
}

interface CredentialInputProps {
  value: string;
  onChange: (value: string, type: CredentialType) => void;
  error?: boolean;
  required?: boolean;
  className?: string;
}

export const CredentialInput = forwardRef<HTMLInputElement, CredentialInputProps>(
  function CredentialInput({ value, onChange, error, required, className }, ref) {
    const mode = detectCredentialType(value);

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(e.target.value, detectCredentialType(e.target.value));
      },
      [onChange],
    );

    // First keystroke in empty field — detect mode, seed phone with +7 prefix
    const handleFirstInput = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value;
        if (detectCredentialType(raw) === 'phone') {
          let d = raw.replace(/\D/g, '');
          if (d === '8') d = '7';
          onChange(d ? `+${d}` : '+7', 'phone');
        } else {
          onChange(raw, detectCredentialType(raw));
        }
      },
      [onChange],
    );

    if (mode === 'phone')
      return <PhoneInput ref={ref} value={value} onChange={handleChange} error={error} required={required} className={className} />;

    if (mode === 'email')
      return <EmailInput ref={ref} value={value} onChange={handleChange} error={error} required={required} className={className} />;

    return <PatternInput ref={ref} value={value} onChange={handleFirstInput} placeholder="Email или телефон" error={error} required={required} className={className} />;
  },
);
