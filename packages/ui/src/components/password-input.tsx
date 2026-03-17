'use client'

import { type InputHTMLAttributes, forwardRef, useState, useMemo } from 'react';
import { cn } from '../utils/cn';

export interface PasswordRule {
  label: string;
  test: (value: string) => boolean;
}

export interface PasswordInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  error?: boolean;
  /** Show the strength indicator below the input. Default: true */
  showStrength?: boolean;
  /** Custom validation rules. If not provided, uses built-in defaults. */
  rules?: PasswordRule[];
  /** Minimum length for the length rule. Default: 8 */
  minLength?: number;
  /** Maximum length for the maxLength rule. Default: 64 */
  maxLength?: number;
}

const EyeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M10 4.375C3.75 4.375 1.25 10 1.25 10C1.25 10 3.75 15.625 10 15.625C16.25 15.625 18.75 10 18.75 10C18.75 10 16.25 4.375 10 4.375Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M10 13.125C11.7259 13.125 13.125 11.7259 13.125 10C13.125 8.27411 11.7259 6.875 10 6.875C8.27411 6.875 6.875 8.27411 6.875 10C6.875 11.7259 8.27411 13.125 10 13.125Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const EyeOffIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M3.75 3.75L16.25 16.25"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M11.7678 11.7678C11.2989 12.2366 10.6629 12.5 10 12.5C9.33696 12.5 8.70107 12.2366 8.23223 11.7678C7.76339 11.2989 7.5 10.663 7.5 10C7.5 9.33696 7.76339 8.70107 8.23223 8.23223"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M5.94531 5.62891C3.11719 7.19141 1.25 10 1.25 10C1.25 10 3.75 15.625 10 15.625C11.5234 15.625 12.8359 15.2344 13.9453 14.6094"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M16.168 13.168C17.8398 11.6445 18.75 10 18.75 10C18.75 10 16.25 4.375 10 4.375C9.47656 4.375 8.97656 4.42578 8.5 4.51953"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M10.5859 7.5625C11.2187 7.72656 11.7656 8.10156 12.1406 8.625C12.5156 9.14844 12.6953 9.78906 12.6484 10.4336"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

function getDefaultRules(min: number, max: number): PasswordRule[] {
  return [
    {
      label: `От ${min} до ${max} символов`,
      test: (v) => v.length >= min && v.length <= max,
    },
    {
      label: 'Заглавная буква (A-Z)',
      test: (v) => /[A-Z]/.test(v),
    },
    {
      label: 'Строчная буква (a-z)',
      test: (v) => /[a-z]/.test(v),
    },
    {
      label: 'Цифра (0-9)',
      test: (v) => /\d/.test(v),
    },
    {
      label: 'Спецсимвол (!@#$%...)',
      test: (v) => /[^A-Za-z0-9]/.test(v),
    },
  ];
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  (
    {
      error,
      className,
      showStrength = true,
      rules,
      minLength: min = 8,
      maxLength: max = 64,
      value,
      ...props
    },
    ref,
  ) => {
    const [visible, setVisible] = useState(false);
    const currentValue = typeof value === 'string' ? value : '';

    const effectiveRules = useMemo(() => rules ?? getDefaultRules(min, max), [rules, min, max]);

    const results = useMemo(
      () => effectiveRules.map((rule) => ({ ...rule, passed: rule.test(currentValue) })),
      [effectiveRules, currentValue],
    );

    const passedCount = results.filter((r) => r.passed).length;
    const total = results.length;

    // Strength level for the bar color
    const strength: 'empty' | 'weak' | 'medium' | 'strong' =
      currentValue.length === 0
        ? 'empty'
        : passedCount <= 2
          ? 'weak'
          : passedCount <= 3
            ? 'medium'
            : 'strong';

    const barColors = {
      empty: 'bg-[#E0E0E0]',
      weak: 'bg-brand-red',
      medium: 'bg-[#F59E0B]',
      strong: 'bg-[#22C55E]',
    } as const;

    return (
      <div className="flex flex-col gap-2">
        <div className="relative">
          <input
            ref={ref}
            type={visible ? 'text' : 'password'}
            value={value}
            className={cn(
              'w-full px-4 py-2.5 pr-11 text-sm text-text-main bg-white',
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
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setVisible((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#999] hover:text-text-main transition-colors cursor-pointer"
            aria-label={visible ? 'Скрыть пароль' : 'Показать пароль'}
          >
            {visible ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        </div>

        {showStrength && currentValue.length > 0 && (
          <div className="flex flex-col gap-1.5">
            {/* Strength bar */}
            <div className="flex gap-1">
              {Array.from({ length: total }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    'h-1 flex-1 rounded-full transition-colors',
                    i < passedCount ? barColors[strength] : 'bg-[#E0E0E0]',
                  )}
                />
              ))}
            </div>

            {/* Rules checklist */}
            <ul className="flex flex-col gap-0.5">
              {results.map((r) => (
                <li
                  key={r.label}
                  className={cn(
                    'flex items-center gap-1.5 text-xs transition-colors',
                    r.passed ? 'text-[#22C55E]' : 'text-[#999]',
                  )}
                >
                  <span className="text-[10px] leading-none">{r.passed ? '\u2713' : '\u2022'}</span>
                  {r.label}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  },
);

PasswordInput.displayName = 'PasswordInput';
