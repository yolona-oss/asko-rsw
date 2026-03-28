'use client';

import { forwardRef, useCallback } from 'react';
import { Input } from '@asko/ui';

export type CredentialType = 'email' | 'phone' | null;

export function detectCredentialType(value: string): CredentialType {
  if (!value) return null;
  const stripped = value.replace(/[\s()\-+]/g, '');
  if (!stripped) return null;
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
    const type = detectCredentialType(value);

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const v = e.target.value;
        onChange(v, detectCredentialType(v));
      },
      [onChange],
    );

    return (
      <Input
        ref={ref}
        value={value}
        onChange={handleChange}
        placeholder="Email или телефон"
        inputMode={type === 'phone' ? 'tel' : 'email'}
        autoComplete={type === 'phone' ? 'tel' : 'email'}
        error={error}
        required={required}
        className={className}
      />
    );
  },
);
