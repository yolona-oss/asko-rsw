'use client';

import { useState, useRef, useEffect, type ReactNode } from 'react';
import { cn } from '../utils/cn';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterDefinition {
  /** Unique key for this filter (used as state key) */
  key: string;
  /** Display label */
  label: string;
  /** Available options (first is usually "All") */
  options: FilterOption[];
  /** Display style: 'select' renders a <select>, 'tabs' renders inline buttons, 'block' renders large rectangular buttons (landing-style) */
  type: 'select' | 'tabs' | 'block';
}

export type FilterValues = Record<string, string>;

// ─── DataFilter container ───────────────────────────────────────────────────

export interface DataFilterProps {
  /** Filter definitions to render */
  filters: FilterDefinition[];
  /** Current filter values (key → selected value) */
  values: FilterValues;
  /** Called when any filter value changes */
  onChange: (key: string, value: string) => void;
  /** Extra content rendered after filters (e.g. sort dropdown) */
  trailing?: ReactNode;
  className?: string;
}

export function DataFilter({ filters, values, onChange, trailing, className }: DataFilterProps) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-4 text-sm',
        className,
      )}
    >
      {filters.map((filter, idx) => (
        <div key={filter.key} className="contents">
          {idx > 0 && (
            <div className="w-px h-6 bg-border-light flex-shrink-0 hidden sm:block" />
          )}
          {filter.type === 'select' ? (
            <FilterSelect
              filter={filter}
              value={values[filter.key] ?? ''}
              onChange={(val) => onChange(filter.key, val)}
            />
          ) : filter.type === 'block' ? (
            <FilterBlock
              filter={filter}
              value={values[filter.key] ?? ''}
              onChange={(val) => onChange(filter.key, val)}
            />
          ) : (
            <FilterTabs
              filter={filter}
              value={values[filter.key] ?? ''}
              onChange={(val) => onChange(filter.key, val)}
            />
          )}
        </div>
      ))}
      {trailing && (
        <>
          {filters.length > 0 && (
            <div className="w-px h-6 bg-border-light flex-shrink-0 hidden sm:block" />
          )}
          {trailing}
        </>
      )}
    </div>
  );
}

// ─── FilterSelect ───────────────────────────────────────────────────────────

interface FilterSelectProps {
  filter: FilterDefinition;
  value: string;
  onChange: (value: string) => void;
}

function FilterSelect({ filter, value, onChange }: FilterSelectProps) {
  return (
    <div className="flex items-center gap-2 flex-shrink-0">
      <span className="font-medium text-text-main">{filter.label}:</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          'px-3 py-1.5 text-sm text-text-main bg-white',
          'border border-border-light rounded-sm outline-none',
          'transition-colors focus:border-text-main',
          'appearance-none cursor-pointer min-w-[100px]',
        )}
      >
        {filter.options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

// ─── FilterTabs ─────────────────────────────────────────────────────────────

interface FilterTabsProps {
  filter: FilterDefinition;
  value: string;
  onChange: (value: string) => void;
}

function FilterTabs({ filter, value, onChange }: FilterTabsProps) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {filter.label && (
        <span className="font-medium text-text-main mr-1">{filter.label}:</span>
      )}
      {filter.options.map((opt) => {
        const isActive = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              'px-3 py-1.5 text-xs font-medium rounded-sm border transition-colors cursor-pointer',
              isActive
                ? 'bg-dark-deep text-white border-dark-deep'
                : 'bg-white text-text-main border-border-light hover:border-text-main',
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

// ─── FilterBlock (large rectangular buttons desktop, dropdown mobile) ────────

function FilterBlock({ filter, value, onChange }: FilterTabsProps) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeLabel = filter.options.find((o) => o.value === value)?.label
    ?? filter.options[0]?.label ?? '';

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  return (
    <>
      {/* Mobile: dropdown */}
      <div className="md:hidden relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 px-4 py-[7.5px] bg-white border border-[#d9d9d9] text-lg font-medium text-[#323232] tracking-[0.005em] cursor-pointer"
        >
          <span className="leading-[18px]">{activeLabel}</span>
          <svg
            className={cn('w-[13px] h-[13px] transition-transform', open && 'rotate-180')}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </button>
        {open && (
          <div className="absolute top-full left-0 mt-1 z-20 bg-white border border-[#d9d9d9] shadow-lg min-w-[200px]">
            {filter.options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={cn(
                  'block w-full px-4 py-2.5 text-left text-base transition-colors cursor-pointer',
                  opt.value === value
                    ? 'bg-[#323232] text-white'
                    : 'text-[#323232] hover:bg-[#f1f1f1]',
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Desktop: block buttons */}
      <div className="hidden md:flex flex-wrap items-center gap-[15px]">
        {filter.options.map((opt) => {
          const isActive = opt.value === value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={cn(
                'px-6 py-2 text-lg leading-[18px] tracking-[0.005em] min-h-[40px] transition-colors cursor-pointer',
                isActive
                  ? 'bg-[#323232] text-white'
                  : 'bg-[#f1f1f1] text-[#323232] border border-[#d9d9d9] hover:border-[#323232]',
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </>
  );
}

// ─── ActiveFilters (chips showing active filters with clear) ────────────────

export interface ActiveFiltersProps {
  filters: FilterDefinition[];
  values: FilterValues;
  onChange: (key: string, value: string) => void;
  className?: string;
}

export function ActiveFilters({ filters, values, onChange, className }: ActiveFiltersProps) {
  const activeFilters = filters.filter((f) => values[f.key] && values[f.key] !== '');
  if (activeFilters.length === 0) return null;

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {activeFilters.map((filter) => {
        const option = filter.options.find((o) => o.value === values[filter.key]);
        if (!option) return null;
        return (
          <span
            key={filter.key}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 text-xs text-text-main rounded-sm"
          >
            <span className="text-text-sub">{filter.label}:</span>
            {option.label}
            <button
              type="button"
              onClick={() => onChange(filter.key, '')}
              className="ml-0.5 text-text-sub hover:text-text-main cursor-pointer"
              aria-label={`Убрать фильтр ${filter.label}`}
            >
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </span>
        );
      })}
      <button
        type="button"
        onClick={() => activeFilters.forEach((f) => onChange(f.key, ''))}
        className="text-xs text-text-sub hover:text-text-main cursor-pointer"
      >
        Сбросить все
      </button>
    </div>
  );
}
