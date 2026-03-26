import type { ReactNode } from 'react';
import { cn } from '../utils/cn';

// ─── Grid columns ───────────────────────────────────────────────────────────

export type CardGridColumns = 1 | 2 | 3 | 4;

const gridStyles: Record<CardGridColumns, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
};

// ─── DataCardView ───────────────────────────────────────────────────────────

export interface DataCardViewProps<T> {
  /** Data items to render */
  data: T[];
  /** Render function for each card */
  renderCard: (item: T, index: number) => ReactNode;
  /** Extract unique key from item */
  keyExtractor: (item: T) => string;
  /** Number of columns (responsive, default 3) */
  columns?: CardGridColumns;
  /** Gap size between cards */
  gap?: 'sm' | 'md' | 'lg';
  /** Content shown when data is empty */
  emptyContent?: ReactNode;
  className?: string;
}

const gapStyles = {
  sm: 'gap-3',
  md: 'gap-4',
  lg: 'gap-6',
} as const;

export function DataCardView<T>({
  data,
  renderCard,
  keyExtractor,
  columns = 3,
  gap = 'md',
  emptyContent,
  className,
}: DataCardViewProps<T>) {
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
        'grid',
        gridStyles[columns],
        gapStyles[gap],
        className,
      )}
    >
      {data.map((item, index) => (
        <div key={keyExtractor(item)}>
          {renderCard(item, index)}
        </div>
      ))}
    </div>
  );
}

// ─── DataCard (individual card wrapper) ─────────────────────────────────────

export interface DataCardProps {
  /** Click handler - makes the card look interactive */
  onClick?: () => void;
  /** Highlighted state (e.g. active item) */
  highlighted?: boolean;
  padding?: 'sm' | 'md' | 'lg';
  className?: string;
  children: ReactNode;
}

const cardPaddingStyles = {
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
} as const;

export function DataCard({
  onClick,
  highlighted,
  padding = 'md',
  className,
  children,
}: DataCardProps) {
  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); } : undefined}
      className={cn(
        'bg-white border rounded-sm flex flex-col gap-3',
        cardPaddingStyles[padding],
        highlighted
          ? 'border-brand-red ring-2 ring-brand-red/20'
          : 'border-border-light',
        onClick && 'cursor-pointer hover:border-text-sub transition-colors',
        className,
      )}
    >
      {children}
    </div>
  );
}

// ─── DataCardField (label + value pair inside a card) ───────────────────────

export interface DataCardFieldProps {
  label: string;
  className?: string;
  children: ReactNode;
}

export function DataCardField({ label, className, children }: DataCardFieldProps) {
  return (
    <div className={className}>
      <p className="text-xs text-text-sub">{label}</p>
      <div className="text-sm text-text-main">{children}</div>
    </div>
  );
}
