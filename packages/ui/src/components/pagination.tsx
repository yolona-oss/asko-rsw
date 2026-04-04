'use client';

import { useMemo } from 'react';
import { cn } from '../utils/cn';

export interface PaginationProps {
  /** Current active page (1-based) */
  page: number;
  /** Total number of pages */
  totalPages: number;
  /** Called when user clicks a page (for client-side pagination) */
  onPageChange?: (page: number) => void;
  /** Generate href for a page (for link-based pagination in client components). Renders <a> tags instead of buttons. */
  getHref?: (page: number) => string;
  /**
   * URL pattern for link-based pagination in server components.
   * Use `{page}` as placeholder, e.g. `"/devices?page={page}"`.
   * Serializable alternative to `getHref` (which can't cross the server→client boundary).
   */
  hrefPattern?: string;
  /** Max visible page buttons before collapsing with ellipsis. Default: 5 */
  maxVisible?: number;
  /** Show Previous/Next text buttons. Default: true */
  showPrevNext?: boolean;
  className?: string;
}

function getPageRange(page: number, totalPages: number, maxVisible: number): (number | 'ellipsis')[] {
  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: (number | 'ellipsis')[] = [];
  const sideCount = Math.floor((maxVisible - 3) / 2);

  pages.push(1);

  const rangeStart = Math.max(2, page - sideCount);
  const rangeEnd = Math.min(totalPages - 1, page + sideCount);

  if (rangeStart > 2) pages.push('ellipsis');
  for (let i = rangeStart; i <= rangeEnd; i++) pages.push(i);
  if (rangeEnd < totalPages - 1) pages.push('ellipsis');

  if (totalPages > 1) pages.push(totalPages);

  return pages;
}

const prevNextBase = 'flex items-center justify-center min-h-[36px] px-4 py-2 text-sm font-medium select-none transition-opacity';
const prevNextEnabled = 'text-[#404040] hover:text-[#0a0a0a] cursor-pointer';
const prevNextDisabled = 'opacity-50 cursor-default pointer-events-none text-[#404040]';

const pageBase = 'flex items-center justify-center min-h-[36px] w-[34px] text-sm font-medium select-none transition-colors cursor-pointer';
const pageActive = 'border border-[#D7102A] text-[#0a0a0a] shadow-sm';
const pageInactive = 'text-[#404040] hover:text-[#0a0a0a]';

function PrevNextItem({ disabled, label, href, onClick }: { disabled: boolean; label: string; href?: string; onClick?: () => void }) {
  const cls = cn(prevNextBase, disabled ? prevNextDisabled : prevNextEnabled);
  if (href && !disabled) return <a href={href} className={cls}>{label}</a>;
  return <button type="button" disabled={disabled} onClick={onClick} className={cls}>{label}</button>;
}

function PageItem({ pageNum, active, href, onClick }: { pageNum: number; active: boolean; href?: string; onClick?: () => void }) {
  const cls = cn(pageBase, active ? pageActive : pageInactive);
  if (href && !active) return <a href={href} className={cls}>{pageNum}</a>;
  if (active) return <span className={cls}>{pageNum}</span>;
  return <button type="button" onClick={onClick} className={cls}>{pageNum}</button>;
}

export function Pagination({
  page,
  totalPages,
  onPageChange,
  getHref: getHrefProp,
  hrefPattern,
  maxVisible = 5,
  showPrevNext = true,
  className,
}: PaginationProps) {
  const getHref = getHrefProp ?? (hrefPattern ? (p: number) => hrefPattern.replace('{page}', String(p)) : undefined);
  const pages = useMemo(
    () => getPageRange(page, totalPages, maxVisible),
    [page, totalPages, maxVisible],
  );

  if (totalPages <= 1) return null;

  return (
    <nav className={cn('flex items-center gap-2', className)}>
      {showPrevNext && (
        <PrevNextItem
          disabled={page <= 1}
          label="Previous"
          href={getHref?.(page - 1)}
          onClick={() => onPageChange?.(page - 1)}
        />
      )}

      {pages.map((item, index) =>
        item === 'ellipsis' ? (
          <span
            key={`ellipsis-${index}`}
            className="flex items-center justify-center min-h-[36px] min-w-[36px] text-sm text-[#404040] select-none"
          >
            &hellip;
          </span>
        ) : (
          <PageItem
            key={item}
            pageNum={item}
            active={item === page}
            href={getHref?.(item)}
            onClick={() => onPageChange?.(item)}
          />
        ),
      )}

      {showPrevNext && (
        <PrevNextItem
          disabled={page >= totalPages}
          label="Next"
          href={getHref?.(page + 1)}
          onClick={() => onPageChange?.(page + 1)}
        />
      )}
    </nav>
  );
}
