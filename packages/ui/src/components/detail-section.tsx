'use client';

import { useState, useEffect, type ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '../utils/cn';
import { SkeletonBlock } from './skeleton';

export interface DetailSectionProps {
  /** Section title */
  label: string;
  /** Summary text shown on the right when collapsed */
  summary?: string;
  /** Content to render when expanded. Can be static or lazy-fetched. */
  children?: ReactNode;
  /** Fetch data on expand. Called once when first expanded. */
  fetchData?: () => Promise<void>;
  /** If true, section starts expanded */
  defaultOpen?: boolean;
  /** Indentation level (for nesting) */
  level?: number;
  className?: string;
}

export function DetailSection({
  label,
  summary,
  children,
  fetchData,
  defaultOpen = false,
  level = 0,
  className,
}: DetailSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(!fetchData);

  useEffect(() => {
    if (!open || fetched || !fetchData) return;
    setLoading(true);
    fetchData()
      .catch(() => {})
      .finally(() => { setLoading(false); setFetched(true); });
  }, [open, fetched, fetchData]);

  return (
    <div className={cn('border-b border-border-light last:border-b-0', className)} style={{ marginLeft: level * 16 }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 py-2.5 text-left cursor-pointer hover:bg-surface-hover transition-colors"
      >
        <ChevronRight className={cn('w-4 h-4 text-text-sub transition-transform flex-shrink-0', open && 'rotate-90')} />
        <span className="text-sm font-medium text-text-main flex-1">{label}</span>
        {!open && summary && (
          <span className="text-sm text-text-sub truncate max-w-[200px]">{summary}</span>
        )}
      </button>
      {open && (
        <div className="pb-2.5 pl-6">
          {loading ? (
            <div className="flex flex-col gap-2">
              <SkeletonBlock className="h-4 w-full" />
              <SkeletonBlock className="h-4 w-3/4" />
            </div>
          ) : (
            children
          )}
        </div>
      )}
    </div>
  );
}
