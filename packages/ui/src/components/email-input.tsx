'use client'

import { type InputHTMLAttributes, forwardRef, useMemo } from 'react';
import { PatternInput, type ValidationResult } from './pattern-input';
import { useUiLocale } from '../locale';
import type { UiLocale } from '../locale';

export interface EmailInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'pattern'> {
  error?: boolean;
  /** Show inline validation feedback. Default: true */
  showValidation?: boolean;
  /** Override the default error message */
  errorMessage?: string;
}

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

function validateEmail(value: string, locale: UiLocale): ValidationResult | null {
  if (!value) return null;

  if (!value.includes('@')) {
    return { valid: false, hint: locale.emailEnterAt };
  }

  const [local, domain] = value.split('@');

  if (!local) {
    return { valid: false, hint: locale.emailEnterUsername };
  }

  if (!domain) {
    return { valid: false, hint: locale.emailEnterDomain };
  }

  if (!domain.includes('.')) {
    return { valid: false, hint: locale.emailDomainDot };
  }

  const parts = domain.split('.');
  const tld = parts[parts.length - 1];
  if (!tld || tld.length < 2) {
    return { valid: false, hint: locale.emailTldTooShort };
  }

  if (EMAIL_REGEX.test(value)) {
    return { valid: true, hint: '' };
  }

  return { valid: false, hint: locale.emailInvalidFormat };
}

export const EmailInput = forwardRef<HTMLInputElement, EmailInputProps>(
  ({ showValidation = true, ...props }, ref) => {
    const locale = useUiLocale();
    const validator = useMemo(
      () => (value: string) => validateEmail(value, locale),
      [locale],
    );
    return (
      <PatternInput
        ref={ref}
        type="email"
        validator={validator}
        showValidation={showValidation}
        showValidBorder
        {...props}
      />
    );
  },
);

EmailInput.displayName = 'EmailInput';
