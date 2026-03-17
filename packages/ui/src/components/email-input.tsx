'use client'

import { type InputHTMLAttributes, forwardRef, useMemo } from 'react';
import { cn } from '../utils/cn';

export interface EmailInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  error?: boolean;
  /** Show inline validation feedback. Default: true */
  showValidation?: boolean;
  /** Override the default error message */
  errorMessage?: string;
}

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

function getEmailHint(value: string): { valid: boolean; hint: string } | null {
  if (!value) return null;

  // Check if user has started typing
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
  ({ error, className, showValidation = true, errorMessage, value, ...props }, ref) => {
    const currentValue = typeof value === 'string' ? value : '';

    const validation = useMemo(() => getEmailHint(currentValue), [currentValue]);

    const hasError = error || (showValidation && validation && !validation.valid && currentValue.length > 0);
    const displayError = errorMessage || (showValidation ? validation?.hint : undefined);

    return (
      <div className="flex flex-col gap-1">
        <input
          ref={ref}
          type="email"
          value={value}
          className={cn(
            'w-full px-4 py-2.5 text-sm text-text-main bg-white',
            'border rounded-sm outline-none transition-colors',
            'placeholder:text-[#999]',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            hasError
              ? 'border-brand-red focus:border-brand-red'
              : validation?.valid
                ? 'border-[#22C55E] focus:border-[#22C55E]'
                : 'border-border-light focus:border-text-main',
            className,
          )}
          {...props}
        />
        {showValidation && currentValue.length > 0 && displayError && !validation?.valid && (
          <p className="text-xs text-brand-red">{displayError}</p>
        )}
      </div>
    );
  },
);

EmailInput.displayName = 'EmailInput';
