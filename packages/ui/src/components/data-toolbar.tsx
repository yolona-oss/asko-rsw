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
  /** Action buttons rendered at the right end */
  actions?: ReactNode;
  /** Extra class on the root container */
  className?: string;
}

export function DataToolbar({
  search,
  filters,
  filterValues,
  onFilterChange,
  actions,
  className,
}: DataToolbarProps) {
  return (
    <div className={cn('flex flex-col lg:flex-row gap-4 items-stretch', className)}>
      {search && (
        <DataSearch
          value={search.value}
          onChange={search.onChange}
          placeholder={search.placeholder}
          className={cn('lg:w-[320px] flex-shrink-0', search.className)}
        />
      )}
      <div className="flex-1 flex items-center gap-3">
        {filters && filterValues && onFilterChange && (
          <DataFilter
            filters={filters}
            values={filterValues}
            onChange={onFilterChange}
          />
        )}
        {actions && (
          <div className="ml-auto flex-shrink-0 flex items-center gap-2">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

DataToolbar.displayName = 'DataToolbar';
