'use client';

import { type ReactNode, useMemo } from 'react';
import { cn } from '../utils/cn';
import { SkeletonCard } from './skeleton';
import { useUiLocale } from '../locale';

export interface DataGroup<T> {
  key: string;
  items: T[];
}

export interface DataGroupedViewProps<T> {
  data: T[];
  groupBy: (item: T) => string;
  /** Explicit ordering of group keys. Keys not in this list are appended in insertion order. Keys listed here with no matching items render as empty groups. */
  groupOrder?: string[];
  /** Renders a single group. Consumer controls the group's visual (card, header, content, expansion). */
  renderGroup: (group: DataGroup<T>, index: number) => ReactNode;
  emptyContent?: ReactNode;
  loading?: boolean;
  loadingGroups?: number;
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}

const gapStyles = {
  sm: 'gap-2',
  md: 'gap-3',
  lg: 'gap-4',
} as const;

export function DataGroupedView<T>({
  data,
  groupBy,
  groupOrder,
  renderGroup,
  emptyContent,
  loading,
  loadingGroups = 4,
  gap = 'md',
  className,
}: DataGroupedViewProps<T>) {
  const locale = useUiLocale();
  const groups = useMemo<DataGroup<T>[]>(() => {
    const map = new Map<string, T[]>();
    const order: string[] = [];
    if (groupOrder) {
      for (const key of groupOrder) {
        if (!map.has(key)) {
          map.set(key, []);
          order.push(key);
        }
      }
    }
    for (const item of data) {
      const key = groupBy(item);
      if (!map.has(key)) {
        map.set(key, []);
        order.push(key);
      }
      map.get(key)!.push(item);
    }
    return order.map((key) => ({ key, items: map.get(key)! }));
  }, [data, groupBy, groupOrder]);

  if (loading) {
    return (
      <div className={cn('flex flex-col', gapStyles[gap], className)}>
        {Array.from({ length: loadingGroups }).map((_, i) => (
          <SkeletonCard key={i} className="h-20" />
        ))}
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="px-5 py-8 text-center text-sm text-text-sub">
        {emptyContent ?? locale.noData}
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col', gapStyles[gap], className)}>
      {groups.map((group, index) => (
        <div key={group.key}>{renderGroup(group, index)}</div>
      ))}
    </div>
  );
}
