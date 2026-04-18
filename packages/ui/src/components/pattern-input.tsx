'use client'

import { type InputHTMLAttributes, forwardRef, useCallback, useMemo } from 'react';
import { cn } from '../utils/cn';
import { useUiLocale } from '../locale';

export interface ValidationResult {
  valid: boolean;
  hint: string;
}

export interface PatternInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'pattern'> {
  error?: boolean;
  /** Regex pattern for basic validation (used when no validator provided) */
  pattern?: RegExp;
  /** Custom validation function - takes priority over pattern */
  validator?: (value: string) => ValidationResult | null;
  /** Format the raw value for display */
  formatter?: (value: string) => string;
  /** Extract raw value from user input */
  extractor?: (value: string) => string;
  /** Only allow keystrokes matching this regex */
  keyFilter?: RegExp;
  /** Show inline validation hints below input */
  showValidation?: boolean;
  /** Override the validation error message */
  errorMessage?: string;
  /** Auto-fill this value on focus when input is empty */
  focusValue?: string;
  /** Called with the raw (extracted) value on change */
  onValueChange?: (raw: string) => void;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /** Show green border when validation passes */
  showValidBorder?: boolean;
}

export const PatternInput = forwardRef<HTMLInputElement, PatternInputProps>(
  ({
    error,
    className,
    pattern,
    validator,
    formatter,
    extractor,
    keyFilter,
    showValidation = false,
    errorMessage,
    focusValue,
    onValueChange,
    onChange,
    onFocus,
    onKeyDown,
    value,
    showValidBorder = false,
    ...props
  }, ref) => {
    const locale = useUiLocale();
    const currentValue = typeof value === 'string' ? value : '';
    const displayValue = formatter ? formatter(currentValue) : currentValue;

    const validation = useMemo(() => {
      if (!currentValue) return null;
      if (validator) return validator(currentValue);
      if (pattern) return { valid: pattern.test(currentValue), hint: locale.patternInvalidFormat };
      return null;
    }, [currentValue, validator, pattern, locale]);

    const hasError = error || (showValidation && validation && !validation.valid && currentValue.length > 0);
    const displayErrorMsg = errorMessage || (showValidation ? validation?.hint : undefined);

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = extractor ? extractor(e.target.value) : e.target.value;
        if (formatter) {
          e.target.value = formatter(raw);
        }
        onChange?.(e);
        onValueChange?.(raw);
      },
      [onChange, onValueChange, formatter, extractor],
    );

    const handleFocus = useCallback(
      (e: React.FocusEvent<HTMLInputElement>) => {
        if (focusValue && !currentValue) {
          e.target.value = focusValue;
          onChange?.(e as any);
          onValueChange?.(extractor ? extractor(focusValue) : focusValue);
        }
        onFocus?.(e);
      },
      [currentValue, focusValue, onChange, onValueChange, extractor, onFocus],
    );

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (keyFilter) {
          const allowedKeys = [
            'Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
            'ArrowLeft', 'ArrowRight', 'Home', 'End',
          ];
          if (!allowedKeys.includes(e.key)
            && !((e.ctrlKey || e.metaKey) && ['a', 'c', 'v', 'x'].includes(e.key.toLowerCase()))
            && !keyFilter.test(e.key)) {
            e.preventDefault();
            return;
          }
        }
        onKeyDown?.(e);
      },
      [keyFilter, onKeyDown],
    );

    const input = (
      <input
        ref={ref}
        value={displayValue}
        onChange={handleChange}
        onFocus={focusValue ? handleFocus : onFocus}
        onKeyDown={keyFilter ? handleKeyDown : onKeyDown}
        className={cn(
          'w-full px-4 py-2.5 text-sm text-text-main bg-surface',
          'border outline-none transition-colors',
          'placeholder:text-text-sub',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          hasError
            ? 'border-brand-red focus:border-brand-red'
            : showValidBorder && validation?.valid
              ? 'border-success focus:border-success'
              : 'border-border-light focus:border-text-main',
          className,
        )}
        {...props}
      />
    );

    if (showValidation) {
      return (
        <div className="flex flex-col gap-1">
          {input}
          {currentValue.length > 0 && displayErrorMsg && !validation?.valid && (
            <p className="text-xs text-brand-red">{displayErrorMsg}</p>
          )}
        </div>
      );
    }

    return input;
  },
);

PatternInput.displayName = 'PatternInput';
