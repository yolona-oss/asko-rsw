import type { ReactNode } from 'react';
import { cn } from '../utils/cn';

// ─── DataListView ───────────────────────────────────────────────────────────

export interface DataListViewProps<T> {
  /** Data items to render */
  data: T[];
  /** Render function for each list item */
  renderItem: (item: T, index: number) => ReactNode;
  /** Extract unique key from item */
  keyExtractor: (item: T) => string;
  /** Whether to show dividers between items (default true) */
  dividers?: boolean;
  /** Content shown when data is empty */
  emptyContent?: ReactNode;
  className?: string;
}

export function DataListView<T>({
  data,
  renderItem,
  keyExtractor,
  dividers = true,
  emptyContent,
  className,
}: DataListViewProps<T>) {
  if (data.length === 0 && emptyContent) {
    return (
      <div className="px-5 py-8 text-center text-sm text-text-sub">
        {emptyContent}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex flex-col border border-border-light rounded-sm overflow-hidden bg-white',
        className,
      )}
    >
      {data.map((item, index) => (
        <div
          key={keyExtractor(item)}
          className={cn(
            dividers && index < data.length - 1 && 'border-b border-border-light',
          )}
        >
          {renderItem(item, index)}
        </div>
      ))}
    </div>
  );
}

// ─── DataListItem (individual list item wrapper) ────────────────────────────

export interface DataListItemProps {
  onClick?: () => void;
  highlighted?: boolean;
  className?: string;
  children: ReactNode;
}

export function DataListItem({
  onClick,
  highlighted,
  className,
  children,
}: DataListItemProps) {
  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); } : undefined}
      className={cn(
        'flex items-center gap-4 px-5 py-4',
        highlighted && 'bg-brand-red/5',
        onClick && 'cursor-pointer hover:bg-gray-50 transition-colors',
        className,
      )}
    >
      {children}
    </div>
  );
}
