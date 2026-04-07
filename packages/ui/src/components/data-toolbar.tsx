'use client';

import type { ReactNode } from 'react';
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
  const hasFilters = !!(filters && filterValues && onFilterChange);

  // No filters — search standalone with actions above
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
        {viewSwitcher && <div className="pt-3">{viewSwitcher}</div>}
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col', className)}>
      {/* Actions above */}
      {actions && (
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {actions}
        </div>
      )}

      {/* Search + Filter bar — same row on desktop, stacked on mobile */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search — separate bordered box */}
        {search && (
          <div className="lg:w-[320px] flex-shrink-0 bg-white border border-[#e5e5e5] shadow-[0_1px_2px_rgba(0,0,0,0.04)] h-[42px] flex items-center [&_input]:border-0 [&_input]:bg-transparent [&_input]:shadow-none [&_input]:py-0 [&_input]:h-full">
            <DataSearch
              value={search.value}
              onChange={search.onChange}
              placeholder={search.placeholder}
              className={cn('w-full h-full', search.className)}
            />
          </div>
        )}

        {/* Filter bar — separate bordered box */}
        <div className={cn(
          'bg-white border border-[#e5e5e5] flex items-center h-[42px] flex-1 min-w-0',
          connectToDataView && '-mb-px relative z-[1]',
        )}>
          <div className="flex-1 min-w-0 overflow-x-auto scrollbar-hide">
            <DataFilter
              filters={filters.map(f => ({ ...f, type: 'select' as const }))}
              values={filterValues}
              onChange={onFilterChange}
              className="px-5 py-2.5 min-w-max"
            />
          </div>
          {inlineActions && (
            <div className="flex-shrink-0 border-l border-[#edeff1] flex items-center self-stretch">
              {inlineActions}
            </div>
          )}
        </div>
      </div>

      {/* ViewSwitcher — below */}
      {viewSwitcher && <div className="pt-3">{viewSwitcher}</div>}
    </div>
  );
}

DataToolbar.displayName = 'DataToolbar';
