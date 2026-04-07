'use client';

import { useRef, useEffect, useState, type ReactNode } from 'react';
import { Eye, ExternalLink } from 'lucide-react';
import { cn } from '../utils/cn';
import { SkeletonCard } from './skeleton';
import { ContextMenuArea } from './dropdown';
import type { DropdownMenuEntry } from './dropdown';

// ─── Auto-inject menu items helper ─────────────────────────────────────────

const detailIcon = <Eye className="w-4 h-4 shrink-0" />;
const navigateIcon = <ExternalLink className="w-4 h-4 shrink-0" />;

/** Build context menu items with auto-injected "Подробнее" and "Перейти" */
export function buildCardMenuItems(
  onClick?: () => void,
  onDoubleClick?: () => void,
  customItems?: DropdownMenuEntry[],
): DropdownMenuEntry[] {
  const auto: DropdownMenuEntry[] = [];
  if (onClick) auto.push({ key: '__detail', label: 'Подробнее', icon: detailIcon, onClick });
  if (onDoubleClick) auto.push({ key: '__navigate', label: 'Перейти', icon: navigateIcon, onClick: onDoubleClick });
  const custom = customItems ?? [];
  if (auto.length === 0) return custom;
  return custom.length > 0 ? [...auto, 'separator', ...custom] : auto;
}

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
  /** When true, renders skeleton cards instead of data */
  loading?: boolean;
  /** Number of skeleton cards to show when loading (default: 6) */
  loadingCards?: number;
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
  loading,
  loadingCards = 6,
  className,
}: DataCardViewProps<T>) {
  if (loading) {
    return (
      <div className={cn('grid', gridStyles[columns], gapStyles[gap], className)}>
        {Array.from({ length: loadingCards }).map((_, i) => (
          <SkeletonCard key={i} className="h-40" />
        ))}
      </div>
    );
  }

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
  /** Double-click handler (navigate/edit) */
  onDoubleClick?: () => void;
  /** Highlighted state (e.g. active item) */
  highlighted?: boolean;
  padding?: 'sm' | 'md' | 'lg';
  /** Custom context menu items (auto-injects "Подробнее"/"Перейти" from onClick/onDoubleClick) */
  menuItems?: DropdownMenuEntry[];
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
  onDoubleClick,
  highlighted,
  padding = 'md',
  menuItems,
  className,
  children,
}: DataCardProps) {
  const resolvedMenu = buildCardMenuItems(onClick, onDoubleClick, menuItems);
  const hasMenu = resolvedMenu.length > 0;

  const card = (
    <div
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); } : undefined}
      className={cn(
        'bg-surface border flex flex-col gap-3',
        cardPaddingStyles[padding],
        highlighted
          ? 'border-brand-red ring-2 ring-brand-red/20'
          : 'border-border-light',
        (onClick || onDoubleClick) && 'cursor-pointer hover:border-text-sub transition-colors',
        className,
      )}
    >
      {children}
    </div>
  );

  if (hasMenu) {
    return <ContextMenuArea items={resolvedMenu}>{card}</ContextMenuArea>;
  }

  return card;
}

// ─── DataCardField (label + value pair inside a card) ───────────────────────

export interface DataCardFieldProps {
  label: string;
  /** Custom tooltip text. If omitted, auto-extracted from content */
  tooltip?: string;
  /** If true, content wraps instead of truncating */
  multiline?: boolean;
  className?: string;
  children: ReactNode;
}

export function DataCardField({ label, tooltip, multiline, className, children }: DataCardFieldProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [autoTitle, setAutoTitle] = useState('');

  useEffect(() => {
    if (tooltip != null) return;
    const el = ref.current;
    if (!el) return;
    const text = el.textContent ?? '';
    setAutoTitle((prev) => (prev !== text ? text : prev));
  });

  return (
    <div className={className}>
      <p className="text-xs text-text-sub">{label}</p>
      <div
        ref={ref}
        title={tooltip ?? autoTitle}
        className={cn(
          'text-sm text-text-main',
          multiline ? 'break-words' : 'truncate',
        )}
      >
        {children}
      </div>
    </div>
  );
}
