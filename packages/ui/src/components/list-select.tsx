'use client';

import { useState, useRef, useEffect, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../utils/cn';

export interface ListSelectOption {
  value: string;
  label: string;
  /** Right-aligned detail content */
  detail?: ReactNode;
  disabled?: boolean;
}

export interface ListSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: ListSelectOption[];
  placeholder?: string;
  className?: string;
}

export function ListSelect({ value, onChange, options, placeholder, className }: ListSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          'w-full flex items-center justify-between text-sm bg-surface',
          'border px-4 py-2.5 transition-colors cursor-pointer',
          open ? 'border-text-main' : 'border-border-light hover:border-text-sub',
        )}
      >
        <span className={cn('truncate', selected ? 'text-text-main' : 'text-text-sub')}>
          {selected?.label ?? placeholder ?? ''}
        </span>
        <ChevronDown
          className={cn(
            'w-4 h-4 text-text-sub flex-shrink-0 ml-2 transition-transform',
            open && 'rotate-180',
          )}
        />
      </button>
      {open && (
        <div className="absolute top-full left-0 right-0 z-10 border border-border-light bg-surface shadow-lg max-h-60 overflow-y-auto mt-px">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              disabled={opt.disabled}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={cn(
                'w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors',
                opt.disabled
                  ? 'opacity-50 cursor-default'
                  : 'hover:bg-surface-hover cursor-pointer',
                opt.value === value && 'bg-primary-50',
              )}
            >
              <span className="truncate text-text-main">{opt.label}</span>
              {opt.detail}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
