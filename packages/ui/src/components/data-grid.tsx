'use client';

import {
  useState,
  useRef,
  useCallback,
  useEffect,
  type ReactNode,
  type MouseEvent as ReactMouseEvent,
} from 'react';
import { cn } from '../utils/cn';
import { ContextMenu } from './dropdown';
import type { DropdownMenuEntry } from './dropdown';

// ─── Types ──────────────────────────────────────────────────────────────────

export type SortOrder = 'asc' | 'desc';

export interface DataGridColumn<T = any> {
  /** Unique key for this column */
  key: string;
  /** Header label */
  header: string;
  /** Initial width in pixels. Omit for flexible (1fr) sizing */
  width?: number;
  /** Minimum width for resizing (default: 60) */
  minWidth?: number;
  /** If true, content wraps instead of truncating */
  multiline?: boolean;
  /** Render function for cell content */
  render: (item: T, index: number) => ReactNode;
  /** Custom tooltip text. If omitted, auto-extracted from cell text content */
  tooltip?: (item: T) => string;
  /** Label shown on mobile (stacked layout) */
  mobileLabel?: string;
  /** If false, this column cannot be sorted. Default: true */
  sortable?: boolean;
}

export interface DataGridProps<T = any> {
  /** Column definitions */
  columns: DataGridColumn<T>[];
  /** Data rows */
  data: T[];
  /** Extract unique key from each item */
  keyExtractor: (item: T) => string;
  /** Content shown when data is empty */
  emptyContent?: ReactNode;
  /** Footer content (e.g. pagination) */
  footer?: ReactNode;
  className?: string;
  /** Current sort column key (controlled) */
  sortKey?: string;
  /** Current sort direction (controlled) */
  sortOrder?: SortOrder;
  /** Called when sort changes. key=null means clear sort */
  onSort?: (key: string | null, order: SortOrder | null) => void;
  /** Called when a row is clicked. Adds cursor-pointer to rows */
  onRowClick?: (item: T) => void;
  /** Custom className per row (e.g. highlight, opacity) */
  rowClassName?: (item: T) => string | undefined;
}

// ─── Inline SVG icons ───────────────────────────────────────────────────────

function SortAscIcon() {
  return (
    <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
    </svg>
  );
}

function SortDescIcon() {
  return (
    <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
  );
}

// ─── CellContent (internal) ─────────────────────────────────────────────────

function CellContent({
  children,
  tooltip,
  multiline,
}: {
  children: ReactNode;
  tooltip?: string;
  multiline?: boolean;
}) {
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
    <div
      ref={ref}
      title={tooltip ?? autoTitle}
      className={cn(
        'min-w-0',
        multiline ? 'break-words whitespace-normal' : 'truncate',
      )}
    >
      {children}
    </div>
  );
}

// ─── Context menu icon helpers ──────────────────────────────────────────────

const eyeOffSvg = <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>;
const eyeSvg = <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const resetSvg = <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" /></svg>;
const sortAscSvg = <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" /></svg>;
const sortDescSvg = <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>;

// ─── Build context menu items ───────────────────────────────────────────────

function buildContextMenuItems(
  columnKey: string | null,
  columnSortable: boolean,
  sortKey: string | undefined,
  sortOrder: SortOrder | undefined,
  hiddenColumns: DataGridColumn[],
  handlers: {
    onSort: (key: string, order: SortOrder) => void;
    onRemove: (key: string) => void;
    onShow: (key: string) => void;
    onReset: () => void;
  },
): { items: DropdownMenuEntry[]; aside: DropdownMenuEntry[] } {
  const items: DropdownMenuEntry[] = [];

  if (columnKey && columnSortable) {
    items.push({
      key: 'sort-asc',
      label: 'По возрастанию',
      icon: sortAscSvg,
      active: sortKey === columnKey && sortOrder === 'asc',
      onClick: () => handlers.onSort(columnKey, 'asc'),
    });
    items.push({
      key: 'sort-desc',
      label: 'По убыванию',
      icon: sortDescSvg,
      active: sortKey === columnKey && sortOrder === 'desc',
      onClick: () => handlers.onSort(columnKey, 'desc'),
    });
  }

  if (columnKey) {
    items.push({
      key: 'remove',
      label: 'Убрать столбец',
      icon: eyeOffSvg,
      onClick: () => handlers.onRemove(columnKey),
    });
    items.push('separator');
  }

  items.push({
    key: 'reset',
    label: 'Сброс настроек',
    icon: resetSvg,
    onClick: () => handlers.onReset(),
  });

  // Hidden columns as aside panel
  const aside: DropdownMenuEntry[] = hiddenColumns.map((col) => ({
    key: `show-${col.key}`,
    label: col.header,
    icon: eyeSvg,
    onClick: () => handlers.onShow(col.key),
  }));

  return { items, aside };
}

// ─── DataGrid ───────────────────────────────────────────────────────────────

export function DataGrid<T>({
  columns,
  data,
  keyExtractor,
  emptyContent,
  footer,
  className,
  sortKey,
  sortOrder,
  onSort,
  onRowClick,
  rowClassName,
}: DataGridProps<T>) {
  const [hiddenKeys, setHiddenKeys] = useState<Set<string>>(new Set());
  const [widths, setWidths] = useState<Record<string, number>>({});
  const [ctxMenu, setCtxMenu] = useState<{
    x: number;
    y: number;
    columnKey: string | null;
  } | null>(null);

  const headerRef = useRef<HTMLDivElement>(null);
  const resizeRef = useRef<{
    key: string;
    startX: number;
    startWidth: number;
  } | null>(null);

  // Derived
  const visibleColumns = columns.filter((c) => !hiddenKeys.has(c.key));
  const hiddenColumnsList = columns.filter((c) => hiddenKeys.has(c.key));

  // Grid template
  const gridTemplate = visibleColumns
    .map((col) => {
      const w = widths[col.key] ?? col.width;
      return w != null ? `${w}px` : 'minmax(0, 1fr)';
    })
    .join(' ');

  // ── Resize ──────────────────────────────────────────────────────────────

  const handleResizeStart = useCallback(
    (e: ReactMouseEvent, col: DataGridColumn<T>) => {
      e.preventDefault();
      e.stopPropagation();

      // Measure actual width if not explicitly set
      let currentWidth = widths[col.key] ?? col.width ?? 150;
      if (!widths[col.key] && !col.width && headerRef.current) {
        const cellEl = headerRef.current.querySelector(
          `[data-col="${col.key}"]`,
        );
        if (cellEl) currentWidth = cellEl.getBoundingClientRect().width;
      }

      resizeRef.current = {
        key: col.key,
        startX: e.clientX,
        startWidth: currentWidth,
      };

      const onMove = (ev: globalThis.MouseEvent) => {
        if (!resizeRef.current) return;
        const diff = ev.clientX - resizeRef.current.startX;
        const minW = col.minWidth ?? 60;
        const newW = Math.max(minW, resizeRef.current.startWidth + diff);
        setWidths((prev) => ({ ...prev, [resizeRef.current!.key]: newW }));
      };

      const onUp = () => {
        resizeRef.current = null;
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };

      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    },
    [widths],
  );

  // ── Context menu ────────────────────────────────────────────────────────

  const openCtxMenu = useCallback(
    (e: ReactMouseEvent, columnKey: string | null) => {
      e.preventDefault();
      setCtxMenu({ x: e.clientX, y: e.clientY, columnKey });
    },
    [],
  );

  const handleRemove = useCallback((key: string) => {
    setHiddenKeys((prev) => new Set([...prev, key]));
  }, []);

  const handleShow = useCallback((key: string) => {
    setHiddenKeys((prev) => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  }, []);

  const handleReset = useCallback(() => {
    setHiddenKeys(new Set());
    setWidths({});
  }, []);

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div
      className={cn(
        'bg-white border border-[#eaeaea] shadow-[0px_10px_60px_0px_rgba(226,236,249,0.5)]',
        className,
      )}
    >
      {/* Header (desktop) */}
      <div
        ref={headerRef}
        className="hidden lg:grid items-center bg-[#f6f6f8] border-b border-[#edeff1] px-6 py-2 text-sm font-medium text-[#323232] sticky top-0 z-10 select-none gap-x-3"
        style={{ gridTemplateColumns: gridTemplate }}
        onContextMenu={(e) => {
          if (!(e.target as HTMLElement).closest('[data-col]')) {
            openCtxMenu(e, null);
          }
        }}
      >
        {visibleColumns.map((col) => {
          const isSortable = onSort != null && col.sortable !== false;
          const isSorted = sortKey === col.key;

          return (
            <div
              key={col.key}
              data-col={col.key}
              className={cn(
                'relative flex items-center gap-1 min-w-0 overflow-hidden text-ellipsis',
                isSortable && 'cursor-pointer',
              )}
              onClick={isSortable ? () => {
                if (sortKey !== col.key) {
                  onSort(col.key, 'asc');
                } else if (sortOrder === 'asc') {
                  onSort(col.key, 'desc');
                } else {
                  onSort(null, null);
                }
              } : undefined}
              onContextMenu={(e) => {
                e.stopPropagation();
                openCtxMenu(e, col.key);
              }}
            >
              <span className="truncate">{col.header}</span>
              {isSorted && sortOrder === 'asc' && <SortAscIcon />}
              {isSorted && sortOrder === 'desc' && <SortDescIcon />}

              {/* Resize handle — visible dot strip */}
              <div
                className="absolute right-0 top-0 bottom-0 w-[7px] flex items-center justify-center cursor-col-resize group/resize"
                onMouseDown={(e) => handleResizeStart(e, col)}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="w-[3px] h-4 rounded-full bg-[#d0d0d0] group-hover/resize:bg-blue-400 transition-colors" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty header area for showing context menu when all columns hidden */}
      {visibleColumns.length === 0 && (
        <div
          className="hidden lg:flex items-center justify-center bg-[#f6f6f8] border-b border-[#edeff1] px-6 py-3 text-sm text-[#999] sticky top-0 z-10"
          onContextMenu={(e) => openCtxMenu(e, null)}
        >
          Все столбцы скрыты — нажмите ПКМ для восстановления
        </div>
      )}

      {/* Body */}
      {data.length === 0 && emptyContent ? (
        <div className="px-8 py-10 text-center text-sm text-text-sub">
          {emptyContent}
        </div>
      ) : (
        data.map((item, rowIndex) => (
          <div
            key={keyExtractor(item)}
            className={cn(
              'flex flex-col lg:grid lg:items-center gap-2 lg:gap-x-3 px-6 py-2.5 border-b border-[#edeff1] last:border-b-0 bg-white hover:bg-[#fafafa] transition-colors',
              onRowClick && 'cursor-pointer',
              rowClassName?.(item),
            )}
            style={{ gridTemplateColumns: gridTemplate }}
            onClick={onRowClick ? () => onRowClick(item) : undefined}
          >
            {visibleColumns.map((col) => (
              <div key={col.key} className="min-w-0 overflow-hidden">
                {col.mobileLabel && (
                  <p className="text-xs text-text-sub lg:hidden">
                    {col.mobileLabel}
                  </p>
                )}
                <CellContent
                  tooltip={col.tooltip?.(item)}
                  multiline={col.multiline}
                >
                  {col.render(item, rowIndex)}
                </CellContent>
              </div>
            ))}
          </div>
        ))
      )}

      {/* Footer */}
      {footer && (
        <div className="px-6 py-2.5 text-sm text-[rgba(50,50,50,0.58)] tracking-[-0.14px] sticky bottom-0 bg-white border-t border-[#edeff1]">
          {footer}
        </div>
      )}

      {/* Context menu */}
      {ctxMenu && (() => {
        const columnSortable =
          onSort != null &&
          ctxMenu.columnKey != null &&
          columns.find((c) => c.key === ctxMenu.columnKey)?.sortable !== false;

        const { items: menuItems, aside: menuAside } = buildContextMenuItems(
          ctxMenu.columnKey,
          columnSortable,
          sortKey,
          sortOrder,
          hiddenColumnsList,
          {
            onSort: (key, order) => onSort?.(key, order),
            onRemove: handleRemove,
            onShow: handleShow,
            onReset: handleReset,
          },
        );

        return (
          <ContextMenu
            x={ctxMenu.x}
            y={ctxMenu.y}
            items={menuItems}
            aside={menuAside.length > 0 ? menuAside : undefined}
            asideTitle="Скрытые столбцы"
            onClose={() => setCtxMenu(null)}
          />
        );
      })()}
    </div>
  );
}
