'use client';

import { useState, useRef, useEffect, type ReactNode } from 'react';
import { ChevronDown, X, Check } from 'lucide-react';
import { cn } from '../utils/cn';
import { useUiLocale } from '../locale';

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
  /** Allow selecting multiple values (renders checkbox dropdown) */
  multiple?: boolean;
}

/** Filter values — string for single-select, string[] for multi-select */
export type FilterValues = Record<string, string | string[]>;

/** Get the active values for a filter key as an array (works for both single and multi) */
export function getFilterValues(values: FilterValues, key: string): string[] {
  const v = values[key];
  if (!v) return [];
  if (Array.isArray(v)) return v;
  return v ? [v] : [];
}

/** Convert a filter value to a string for API query params (joins arrays with commas) */
export function filterValueToParam(values: FilterValues, key: string): string | undefined {
  const v = values[key];
  if (!v) return undefined;
  if (Array.isArray(v)) return v.length > 0 ? v.join(',') : undefined;
  return v || undefined;
}

/** Check if any filter value matches (for single: exact match, for multi: includes) */
export function matchesFilter(values: FilterValues, key: string, itemValue: string): boolean {
  const v = values[key];
  if (!v || (Array.isArray(v) && v.length === 0) || v === '') return true; // no filter = match all
  if (Array.isArray(v)) return v.includes(itemValue);
  return v === itemValue;
}

// ─── DataFilter container ───────────────────────────────────────────────────

export interface DataFilterProps {
  /** Filter definitions to render */
  filters: FilterDefinition[];
  /** Current filter values (key → selected value or values) */
  values: FilterValues;
  /** Called when any filter value changes */
  onChange: (key: string, value: string | string[]) => void;
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
            <div className="w-px h-[35px] bg-border-divider flex-shrink-0 hidden sm:block" />
          )}
          {filter.multiple ? (
            <FilterMultiSelect
              filter={filter}
              value={Array.isArray(values[filter.key]) ? values[filter.key] as string[] : values[filter.key] ? [values[filter.key] as string] : []}
              onChange={(val) => onChange(filter.key, val)}
            />
          ) : filter.type === 'select' ? (
            <FilterSelect
              filter={filter}
              value={(values[filter.key] as string) ?? ''}
              onChange={(val) => onChange(filter.key, val)}
            />
          ) : filter.type === 'block' ? (
            <FilterBlock
              filter={filter}
              value={(values[filter.key] as string) ?? ''}
              onChange={(val) => onChange(filter.key, val)}
            />
          ) : (
            <FilterTabs
              filter={filter}
              value={(values[filter.key] as string) ?? ''}
              onChange={(val) => onChange(filter.key, val)}
            />
          )}
        </div>
      ))}
      {trailing && (
        <>
          {filters.length > 0 && (
            <div className="w-px h-[35px] bg-border-divider flex-shrink-0 hidden sm:block" />
          )}
          {trailing}
        </>
      )}
    </div>
  );
}

// ─── FilterSelect (single) ─────────────────────────────────────────────────

interface FilterSelectProps {
  filter: FilterDefinition;
  value: string;
  onChange: (value: string) => void;
}

function FilterSelect({ filter, value, onChange }: FilterSelectProps) {
  return (
    <div className="flex items-center gap-2 flex-shrink-0">
      <span className="font-medium text-text-main text-sm leading-[18px] tracking-[-0.14px] whitespace-nowrap">
        {filter.label}:
      </span>
      <div className="relative flex items-center">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="appearance-none bg-transparent pr-6 text-sm leading-[18px] tracking-[-0.14px] text-text-main cursor-pointer outline-none"
        >
          {filter.options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <ChevronDown className="w-4 h-4 text-text-main absolute right-0 pointer-events-none" />
      </div>
    </div>
  );
}

// ─── FilterMultiSelect (multiple values with checkboxes) ────────────────────

interface FilterMultiSelectProps {
  filter: FilterDefinition;
  value: string[];
  onChange: (value: string[]) => void;
}

function FilterMultiSelect({ filter, value, onChange }: FilterMultiSelectProps) {
  const locale = useUiLocale();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const toggle = (optValue: string) => {
    if (value.includes(optValue)) {
      onChange(value.filter(v => v !== optValue));
    } else {
      onChange([...value, optValue]);
    }
  };

  const selectedLabels = value.length > 0
    ? filter.options.filter(o => value.includes(o.value)).map(o => o.label)
    : null;

  const displayText = selectedLabels
    ? selectedLabels.length <= 2
      ? selectedLabels.join(', ')
      : `${selectedLabels[0]} +${selectedLabels.length - 1}`
    : locale.filterAll;

  return (
    <div ref={ref} className="relative flex items-center gap-2 flex-shrink-0">
      <span className="font-medium text-text-main text-sm leading-[18px] tracking-[-0.14px] whitespace-nowrap">
        {filter.label}:
      </span>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-[7px] cursor-pointer text-sm leading-[18px] tracking-[-0.14px] text-text-main"
      >
        <span className="whitespace-nowrap">{displayText}</span>
        <ChevronDown className={cn('w-4 h-4 text-text-main transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 z-30 bg-surface border border-border shadow-lg min-w-[180px]">
          {/* Clear all */}
          {value.length > 0 && (
            <button
              type="button"
              onClick={() => onChange([])}
              className="block w-full px-3 py-2 text-left text-xs text-text-sub hover:bg-surface-hover cursor-pointer border-b border-border-divider"
            >
              Сбросить
            </button>
          )}
          {filter.options.filter(o => o.value !== '').map((opt) => {
            const checked = value.includes(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => toggle(opt.value)}
                className="flex items-center gap-2 w-full px-3 py-2 text-left text-sm text-text-main hover:bg-surface-hover cursor-pointer"
              >
                <span className={cn(
                  'w-4 h-4 border flex items-center justify-center flex-shrink-0',
                  checked ? 'bg-brand-red border-brand-red' : 'border-border-light',
                )}>
                  {checked && <Check className="w-3 h-3 text-text-on-brand" strokeWidth={3} />}
                </span>
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}


// ─── FilterTabs ─────────────────────────────────────────────────────────────

function FilterTabs({ filter, value, onChange }: FilterSelectProps) {
  return (
    <div className="flex flex-wrap items-center">
      {filter.label && (
        <span className="font-medium text-text-main mr-2">{filter.label}:</span>
      )}
      {filter.options.map((opt) => {
        const isActive = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              'px-3 py-1.5 text-xs font-medium border transition-colors cursor-pointer -ml-px first:ml-0',
              isActive
                ? 'bg-dark-deep text-text-on-dark border-dark-deep relative z-[1]'
                : 'bg-surface text-text-main border-border-light hover:border-text-main',
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

function FilterBlock({ filter, value, onChange }: FilterSelectProps) {
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
          className="flex items-center gap-2 px-4 py-[7.5px] bg-surface border border-border-light text-lg font-medium text-text-main tracking-[0.005em] cursor-pointer"
        >
          <span className="leading-[18px]">{activeLabel}</span>
          <ChevronDown className={cn('w-[13px] h-[13px] transition-transform', open && 'rotate-180')} />
        </button>
        {open && (
          <div className="absolute top-full left-0 mt-1 z-20 bg-surface border border-border-light shadow-lg min-w-[200px]">
            {filter.options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={cn(
                  'block w-full px-4 py-2.5 text-left text-base transition-colors cursor-pointer',
                  opt.value === value
                    ? 'bg-dark text-text-on-dark'
                    : 'text-text-main hover:bg-surface-secondary',
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
                  ? 'bg-dark text-text-on-dark'
                  : 'bg-surface-secondary text-text-main border border-border-light hover:border-dark',
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
  onChange: (key: string, value: string | string[]) => void;
  className?: string;
}

export function ActiveFilters({ filters, values, onChange, className }: ActiveFiltersProps) {
  const activeFilters = filters.filter((f) => {
    const v = values[f.key];
    if (!v) return false;
    if (Array.isArray(v)) return v.length > 0;
    return v !== '';
  });
  if (activeFilters.length === 0) return null;

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {activeFilters.map((filter) => {
        const v = values[filter.key];
        const selectedValues = Array.isArray(v) ? v : [v];
        return selectedValues.map((sv) => {
          const option = filter.options.find((o) => o.value === sv);
          if (!option) return null;
          return (
            <span
              key={`${filter.key}-${sv}`}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-surface-secondary text-xs text-text-main"
            >
              <span className="text-text-sub">{filter.label}:</span>
              {option.label}
              <button
                type="button"
                onClick={() => {
                  if (Array.isArray(v)) {
                    onChange(filter.key, v.filter(x => x !== sv));
                  } else {
                    onChange(filter.key, '');
                  }
                }}
                className="ml-0.5 text-text-sub hover:text-text-main cursor-pointer"
                aria-label={`Убрать ${filter.label}: ${option.label}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          );
        });
      })}
      <button
        type="button"
        onClick={() => activeFilters.forEach((f) => onChange(f.key, f.multiple ? [] : ''))}
        className="text-xs text-text-sub hover:text-text-main cursor-pointer"
      >
        Сбросить все
      </button>
    </div>
  );
}
