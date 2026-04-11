'use client'

import { type InputHTMLAttributes, forwardRef, useState, useMemo } from 'react';
import { Eye, EyeOff } from 'lucide-react';
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


function getDefaultRules(min: number, max: number): PasswordRule[] {
  return [
    {
      label: `от ${min} до ${max} символов`,
      test: (v) => v.length >= min && v.length <= max,
    },
    {
      label: 'минимум одна заглавная буква (A-Z)',
      test: (v) => /[A-Z]/.test(v),
    },
    {
      label: 'минимум одна строчная буква (a-z)',
      test: (v) => /[a-z]/.test(v),
    },
    {
      label: 'минимум одна цифра или спецсимвол',
      test: (v) => /\d/.test(v) || /[^A-Za-z0-9]/.test(v),
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
      empty: 'bg-border-light',
      weak: 'bg-brand-red',
      medium: 'bg-warning',
      strong: 'bg-success',
    } as const;

    return (
      <div className="flex flex-col gap-2">
        <div className="relative">
          <input
            ref={ref}
            type={visible ? 'text' : 'password'}
            value={value}
            className={cn(
              'w-full px-4 py-2.5 pr-11 text-sm text-text-main bg-surface',
              'border outline-none transition-colors',
              'placeholder:text-text-sub',
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
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-sub hover:text-text-main transition-colors cursor-pointer"
            aria-label={visible ? 'Скрыть пароль' : 'Показать пароль'}
          >
            {visible ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>

        {showStrength && currentValue.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <div className="flex gap-1">
              {Array.from({ length: total }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    'h-1 flex-1 rounded-full transition-colors',
                    i < passedCount ? barColors[strength] : 'bg-border-light',
                  )}
                />
              ))}
            </div>
            {passedCount < total && (
              <p className="text-xs text-text-sub">
                {results.find((r) => !r.passed)?.label}
              </p>
            )}
          </div>
        )}
      </div>
    );
  },
);

PasswordInput.displayName = 'PasswordInput';
