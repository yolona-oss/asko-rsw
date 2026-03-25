'use client';

import { useState, useEffect, useRef, type InputHTMLAttributes } from 'react';
import { cn } from '../utils/cn';

export interface DataSearchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  /** Current search value (controlled) */
  value: string;
  /** Called with debounced value */
  onChange: (value: string) => void;
  /** Debounce delay in ms (default 400) */
  debounce?: number;
  /** Show clear button when value is non-empty (default true) */
  clearable?: boolean;
}

export function DataSearch({
  value,
  onChange,
  debounce = 400,
  clearable = true,
  placeholder = 'Поиск...',
  className,
  ...props
}: DataSearchProps) {
  const [localValue, setLocalValue] = useState(value);
  const isExternalUpdate = useRef(false);

  // Sync external value changes
  useEffect(() => {
    isExternalUpdate.current = true;
    setLocalValue(value);
  }, [value]);

  // Debounce local → external
  useEffect(() => {
    if (isExternalUpdate.current) {
      isExternalUpdate.current = false;
      return;
    }
    const timer = setTimeout(() => onChange(localValue), debounce);
    return () => clearTimeout(timer);
  }, [localValue, debounce]);

  const handleClear = () => {
    setLocalValue('');
    onChange('');
  };

  return (
    <div className={cn('relative', className)}>
      {/* Search icon */}
      <svg
        className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-text-sub pointer-events-none"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
        />
      </svg>

      <input
        type="text"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        placeholder={placeholder}
        className={cn(
          'w-full pl-10 pr-4 py-2.5 text-sm text-text-main bg-white',
          'border border-border-light rounded-sm outline-none transition-colors',
          'placeholder:text-text-sub',
          'focus:border-text-main',
          clearable && localValue && 'pr-9',
        )}
        {...props}
      />

      {/* Clear button */}
      {clearable && localValue && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-text-sub hover:text-text-main cursor-pointer"
          aria-label="Очистить поиск"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
