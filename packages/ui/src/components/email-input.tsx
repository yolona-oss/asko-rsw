'use client'

import { type InputHTMLAttributes, forwardRef } from 'react';
import { PatternInput, type ValidationResult } from './pattern-input';

export interface EmailInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'pattern'> {
  error?: boolean;
  /** Show inline validation feedback. Default: true */
  showValidation?: boolean;
  /** Override the default error message */
  errorMessage?: string;
}

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

function validateEmail(value: string): ValidationResult | null {
  if (!value) return null;

  if (!value.includes('@')) {
    return { valid: false, hint: 'Введите символ @' };
  }

  const [local, domain] = value.split('@');

  if (!local) {
    return { valid: false, hint: 'Введите имя пользователя перед @' };
  }

  if (!domain) {
    return { valid: false, hint: 'Введите домен после @' };
  }

  if (!domain.includes('.')) {
    return { valid: false, hint: 'Домен должен содержать точку (например .com)' };
  }

  const parts = domain.split('.');
  const tld = parts[parts.length - 1];
  if (!tld || tld.length < 2) {
    return { valid: false, hint: 'Доменная зона слишком короткая' };
  }

  if (EMAIL_REGEX.test(value)) {
    return { valid: true, hint: '' };
  }

  return { valid: false, hint: 'Некорректный формат email' };
}

export const EmailInput = forwardRef<HTMLInputElement, EmailInputProps>(
  ({ showValidation = true, ...props }, ref) => (
    <PatternInput
      ref={ref}
      type="email"
      validator={validateEmail}
      showValidation={showValidation}
      showValidBorder
      {...props}
    />
  ),
);

EmailInput.displayName = 'EmailInput';
