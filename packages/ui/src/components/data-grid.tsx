'use client';

import {
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
  type ReactNode,
  type MouseEvent as ReactMouseEvent,
} from 'react';
import { ChevronUp, ChevronDown, EyeOff, Eye, RotateCcw, ExternalLink } from 'lucide-react';
import { cn } from '../utils/cn';
import { SkeletonBlock } from './skeleton';
import { ContextMenu } from './dropdown';
import type { DropdownMenuEntry } from './dropdown';

// ─── Types ──────────────────────────────────────────────────────────────────

export type SortOrder = 'asc' | 'desc';

export interface DataGridColumn<T = any> {
  /** Unique key for this column */
  key: string;
  /** Header label */
  header: string;
  /** Fixed width in pixels. Omit for auto-sized flexible columns */
  width?: number;
  /** Minimum width in pixels (default: 60) */
  minWidth?: number;
  /** Importance coefficient for auto-sizing (default: 1). Higher = more space */
  weight?: number;
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

// ─── Auto-sizing helpers ───────────────────────────────────────────────────

const AUTO_SAMPLE_ROWS = 30;
const MIN_FR = 0.5;

/** Extract plain text from a ReactNode tree without rendering to DOM */
function extractText(node: ReactNode): string {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string') return node;
  if (typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(extractText).join('');
  if (typeof node === 'object' && 'props' in node) {
    return extractText((node as any).props.children);
  }
  return '';
}

/** Compute weighted fr values for flexible columns based on content + importance */
function computeAutoFr<T>(
  columns: DataGridColumn<T>[],
  data: T[],
): Record<string, number> {
  const result: Record<string, number> = {};
  const sample = data.slice(0, AUTO_SAMPLE_ROWS);

  for (const col of columns) {
    if (col.width != null) continue; // fixed-width columns are skipped

    // Start with header length as baseline
    let maxLen = col.header.length;

    // Sample data rows to find longest content
    for (let i = 0; i < sample.length; i++) {
      const text = extractText(col.render(sample[i], i));
      if (text.length > maxLen) maxLen = text.length;
    }

    // Apply importance coefficient
    const weight = col.weight ?? 1;
    result[col.key] = Math.max(MIN_FR, maxLen * weight);
  }

  // Normalize so the average is ~1fr (keeps values readable)
  const values = Object.values(result);
  if (values.length > 0) {
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    if (avg > 0) {
      for (const key in result) {
        result[key] = Math.round((result[key] / avg) * 100) / 100;
      }
    }
  }

  return result;
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
  /** Called on single click (opens detail). When onRowDoubleClick is also set, fires after 250ms debounce */
  onRowClick?: (item: T) => void;
  /** Called on double click (opens editor/navigates). When set, single click is debounced */
  onRowDoubleClick?: (item: T) => void;
  /** If true, DataGrid will NOT auto-add "Подробнее" to context menu. Default: false */
  suppressDetailMenuItem?: boolean;
  /** Custom className per row (e.g. highlight, opacity) */
  rowClassName?: (item: T) => string | undefined;
  /** Returns context menu items for a row (right-click / long-press) */
  rowMenu?: (item: T) => DropdownMenuEntry[];
  /** When true, renders skeleton rows instead of data */
  loading?: boolean;
  /** Number of skeleton rows to show when loading (default: 5) */
  loadingRows?: number;
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

const eyeOffSvg = <EyeOff className="w-4 h-4 shrink-0" />;
const eyeSvg = <Eye className="w-4 h-4 shrink-0" />;
const resetSvg = <RotateCcw className="w-4 h-4 shrink-0" />;
const sortAscSvg = <ChevronUp className="w-4 h-4 shrink-0" />;
const sortDescSvg = <ChevronDown className="w-4 h-4 shrink-0" />;

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

const CLICK_DEBOUNCE_MS = 250;
const detailIcon = <Eye className="w-4 h-4 shrink-0" />;
const editIcon = <ExternalLink className="w-4 h-4 shrink-0" />;

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
  onRowDoubleClick,
  suppressDetailMenuItem,
  rowClassName,
  rowMenu: rowMenuFn,
  loading: isLoading,
  loadingRows = 5,
}: DataGridProps<T>) {
  const [hiddenKeys, setHiddenKeys] = useState<Set<string>>(new Set());
  const [widths, setWidths] = useState<Record<string, number>>({});
  const [rowMenuState, setRowMenuState] = useState<{ x: number; y: number; item: T } | null>(null);
  const longPressRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
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

  // Auto-inject "Подробнее" and "Перейти" into row context menu
  const resolvedRowMenuFn = useMemo(() => {
    const autoDetail = onRowClick && !suppressDetailMenuItem;
    const autoEdit = !!onRowDoubleClick;
    if (!rowMenuFn && !autoDetail && !autoEdit) return undefined;
    return (item: T): DropdownMenuEntry[] => {
      const userItems = rowMenuFn ? rowMenuFn(item) : [];
      const autoItems: DropdownMenuEntry[] = [];
      if (autoDetail) {
        autoItems.push({ key: '__detail', label: 'Подробнее', icon: detailIcon, onClick: () => onRowClick(item) });
      }
      if (autoEdit) {
        autoItems.push({ key: '__edit', label: 'Перейти', icon: editIcon, onClick: () => onRowDoubleClick!(item) });
      }
      if (autoItems.length === 0) return userItems;
      return userItems.length > 0
        ? [...autoItems, 'separator', ...userItems]
        : autoItems;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowMenuFn, onRowClick, onRowDoubleClick, suppressDetailMenuItem]);

  const hasRowMenu = resolvedRowMenuFn != null;

  // Auto-compute fr weights from content length + importance coefficient
  const autoFr = useMemo(
    () => computeAutoFr(visibleColumns, data),
    // Recompute when columns change or data length changes (not on every data update)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [visibleColumns.map((c) => c.key).join(','), data.length],
  );

  // Grid template — fixed-width columns use px, flexible columns use weighted fr
  const gridTemplate = visibleColumns
    .map((col) => {
      const w = widths[col.key] ?? col.width;
      if (w != null) return `${w}px`;
      const min = col.minWidth ?? 100;
      const fr = autoFr[col.key] ?? 1;
      return `minmax(${min}px, ${fr}fr)`;
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
        'bg-surface border-y lg:border border-border shadow-sm overflow-x-auto -mx-4 lg:mx-0',
        className,
      )}
    >
      {/* Header (desktop) */}
      <div
        ref={headerRef}
        className="hidden lg:grid items-center bg-surface-secondary border-b border-border-divider px-6 py-2 text-sm font-medium text-text-main sticky top-0 z-10 select-none gap-x-3 min-w-max"
        style={{ gridTemplateColumns: gridTemplate }}
        onContextMenu={(e) => {
          if (!(e.target as HTMLElement).closest('[data-col]')) {
            openCtxMenu(e, null);
          }
        }}
      >
        {visibleColumns.map((col, colIndex) => {
          const isSortable = onSort != null && col.sortable !== false;
          const isSorted = sortKey === col.key;
          const isLast = colIndex === visibleColumns.length - 1;

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
              {isSorted && sortOrder === 'asc' && <ChevronUp className="w-3.5 h-3.5 shrink-0" />}
              {isSorted && sortOrder === 'desc' && <ChevronDown className="w-3.5 h-3.5 shrink-0" />}

              {/* Resize handle — full-height visible dot, hidden on last column */}
              {!isLast && (
                <div
                  className="absolute right-0 -top-2 -bottom-2 w-[7px] flex items-center justify-center cursor-col-resize group/resize"
                  onMouseDown={(e) => handleResizeStart(e, col)}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="w-[3px] h-full rounded-full bg-[#d0d0d0] group-hover/resize:bg-blue-400 transition-colors" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty header area for showing context menu when all columns hidden */}
      {visibleColumns.length === 0 && (
        <div
          className="hidden lg:flex items-center justify-center bg-surface-secondary border-b border-border-divider px-6 py-3 text-sm text-text-sub sticky top-0 z-10"
          onContextMenu={(e) => openCtxMenu(e, null)}
        >
          Все столбцы скрыты — нажмите ПКМ для восстановления
        </div>
      )}

      {/* Body */}
      {isLoading ? (
        Array.from({ length: loadingRows }).map((_, i) => (
          <div
            key={`skeleton-${i}`}
            className="flex flex-col lg:grid lg:items-center gap-2 lg:gap-x-3 px-4 lg:px-6 py-3 border-b border-border-divider last:border-b-0 bg-surface lg:min-w-max"
            style={{ gridTemplateColumns: gridTemplate }}
          >
            {visibleColumns.map((col) => (
              <div key={col.key} className="min-w-0">
                <SkeletonBlock className="h-4 w-full" />
              </div>
            ))}
          </div>
        ))
      ) : data.length === 0 && emptyContent ? (
        <div className="px-4 lg:px-8 py-10 text-center text-sm text-text-sub">
          {emptyContent}
        </div>
      ) : (
        data.map((item, rowIndex) => (
          <div
            key={keyExtractor(item)}
            className={cn(
              'flex flex-col lg:grid lg:items-center gap-2 lg:gap-x-3 px-4 lg:px-6 py-2.5 border-b border-border-divider last:border-b-0 bg-surface hover:bg-surface-hover transition-colors lg:min-w-max',
              (onRowClick || onRowDoubleClick) && 'cursor-pointer',
              rowClassName?.(item),
            )}
            style={{ gridTemplateColumns: gridTemplate }}
            onClick={onRowClick ? () => {
              if (onRowDoubleClick) {
                // Debounce: wait to see if double click follows
                if (clickTimer.current) clearTimeout(clickTimer.current);
                clickTimer.current = setTimeout(() => { clickTimer.current = null; onRowClick(item); }, CLICK_DEBOUNCE_MS);
              } else {
                onRowClick(item);
              }
            } : undefined}
            onDoubleClick={onRowDoubleClick ? () => {
              if (clickTimer.current) { clearTimeout(clickTimer.current); clickTimer.current = null; }
              onRowDoubleClick(item);
            } : undefined}
            onContextMenu={(hasRowMenu) ? (e) => {
              e.preventDefault();
              setRowMenuState({ x: e.clientX, y: e.clientY, item });
            } : undefined}
            onTouchStart={(hasRowMenu) ? (e) => {
              const touch = e.touches[0];
              longPressRef.current = setTimeout(() => {
                setRowMenuState({ x: touch.clientX, y: touch.clientY, item });
              }, 500);
            } : undefined}
            onTouchEnd={(hasRowMenu) ? () => {
              if (longPressRef.current) { clearTimeout(longPressRef.current); longPressRef.current = null; }
            } : undefined}
            onTouchMove={(hasRowMenu) ? () => {
              if (longPressRef.current) { clearTimeout(longPressRef.current); longPressRef.current = null; }
            } : undefined}
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
        <div className="px-4 lg:px-6 py-2.5 text-sm text-[rgba(50,50,50,0.58)] tracking-[-0.14px] sticky bottom-0 bg-surface border-t border-border-divider">
          {footer}
        </div>
      )}

      {/* Row context menu */}
      {rowMenuState && resolvedRowMenuFn && (
        <ContextMenu
          x={rowMenuState.x}
          y={rowMenuState.y}
          items={resolvedRowMenuFn(rowMenuState.item)}
          onClose={() => setRowMenuState(null)}
        />
      )}

      {/* Header context menu */}
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
