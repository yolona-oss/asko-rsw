'use client';

import { useState, useEffect, type InputHTMLAttributes } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '../utils/cn';
import { useUiLocale } from '../locale';

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
  placeholder,
  className,
  ...props
}: DataSearchProps) {
  const locale = useUiLocale();
  const [localValue, setLocalValue] = useState(value);
  const [lastSyncedValue, setLastSyncedValue] = useState(value);

  // Sync external value → local (without triggering debounce back)
  if (value !== lastSyncedValue) {
    setLastSyncedValue(value);
    setLocalValue(value);
  }

  // Debounce local → external
  useEffect(() => {
    if (localValue === value) return;
    const timer = setTimeout(() => onChange(localValue), debounce);
    return () => clearTimeout(timer);
  }, [localValue, debounce, value, onChange]);

  const handleClear = () => {
    setLocalValue('');
    onChange('');
  };

  return (
    <div className={cn('relative', className)}>
      {/* Search icon */}
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-text-sub pointer-events-none" />

      <input
        type="text"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        placeholder={placeholder ?? locale.searchPlaceholder}
        className={cn(
          'w-full pl-10 pr-4 py-2.5 text-sm text-text-main bg-surface',
          'border border-border-light outline-none transition-colors',
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
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
