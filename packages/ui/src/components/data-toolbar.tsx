'use client';

import { useRef, useState, useEffect, type ReactNode } from 'react';
import { cn } from '../utils/cn';
import { DataSearch } from './data-search';
import { DataFilter, type FilterDefinition, type FilterValues } from './data-filter';

export interface DataToolbarSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export interface DataToolbarProps {
  /** Search input config. Omit to hide search. */
  search?: DataToolbarSearchProps;
  /** Filter definitions. Omit to hide filters. */
  filters?: FilterDefinition[];
  /** Current filter values */
  filterValues?: FilterValues;
  /** Filter change handler */
  onFilterChange?: (key: string, value: string) => void;
  /** Action buttons rendered above the filter bar (regular buttons, links) */
  actions?: ReactNode;
  /** Actions rendered inside the filter bar on the right (dropdown openers) */
  inlineActions?: ReactNode;
  /** When true, the toolbar bar visually connects to the DataGrid below (no gap between borders) */
  connectToDataView?: boolean;
  /** ViewSwitcher (or any node) rendered below the filter bar, closest to the data view */
  viewSwitcher?: ReactNode;
  /** Extra class on the root container */
  className?: string;
}

const WIDE_THRESHOLD = 600;

export function DataToolbar({
  search,
  filters,
  filterValues,
  onFilterChange,
  actions,
  inlineActions,
  connectToDataView,
  viewSwitcher,
  className,
}: DataToolbarProps) {
  const filterRef = useRef<HTMLDivElement>(null);
  const [isWide, setIsWide] = useState(false);
  const hasFilters = !!(filters && filterValues && onFilterChange);

  useEffect(() => {
    const el = filterRef.current;
    if (!el) return;
    const check = () => setIsWide(el.scrollWidth > WIDE_THRESHOLD);
    check();
    const observer = new ResizeObserver(check);
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasFilters]);

  // No filters — render search standalone with actions above
  if (!hasFilters) {
    return (
      <div className={cn('flex flex-col gap-3', className)}>
        {actions && (
          <div className="flex flex-wrap items-center gap-2">
            {actions}
          </div>
        )}
        {search && (
          <DataSearch
            value={search.value}
            onChange={search.onChange}
            placeholder={search.placeholder}
            className={search.className}
          />
        )}
        {viewSwitcher && (
          <div className="pt-3">
            {viewSwitcher}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col', className)}>
      {/* Actions above toolbar */}
      {actions && (
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {actions}
        </div>
      )}

      {/* Search above bar when filters are wide */}
      {isWide && search && (
        <DataSearch
          value={search.value}
          onChange={search.onChange}
          placeholder={search.placeholder}
          className={cn('mb-3', search.className)}
        />
      )}

      {/* Toolbar bar — bordered, white bg, matches DataGrid border */}
      <div className={cn(
        'bg-white border border-[#eaeaea] flex items-center min-h-[42px]',
        connectToDataView && '-mb-px relative z-[1]',
      )}>
        {/* Search inline when narrow */}
        {!isWide && search && (
          <div className="flex-shrink-0 border-r border-[#edeff1] [&_input]:border-0 [&_input]:bg-transparent">
            <DataSearch
              value={search.value}
              onChange={search.onChange}
              placeholder={search.placeholder}
              className={cn('w-[200px] lg:w-[280px]', search.className)}
            />
          </div>
        )}

        {/* Filters — scrollable, forced to dropdown style */}
        <div ref={filterRef} className="flex-1 min-w-0 overflow-x-auto scrollbar-hide">
          <DataFilter
            filters={filters.map(f => ({ ...f, type: 'select' as const }))}
            values={filterValues}
            onChange={onFilterChange}
            className="px-3 lg:px-5 py-2.5 min-w-max"
          />
        </div>

        {/* Inline actions — dropdown openers, inside the bar */}
        {inlineActions && (
          <div className="flex-shrink-0 border-l border-[#edeff1] flex items-center self-stretch">
            {inlineActions}
          </div>
        )}
      </div>

      {/* ViewSwitcher — below filter bar, closest to data view */}
      {viewSwitcher && (
        <div className="pt-3">
          {viewSwitcher}
        </div>
      )}
    </div>
  );
}

DataToolbar.displayName = 'DataToolbar';
