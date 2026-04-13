'use client';

import {
  useState,
  useRef,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { ChevronRight } from 'lucide-react';
import { cn } from '../utils/cn';

// ─── Types ──────────────────────────────────────────────────────────────────

export type DropdownPlacement =
  | 'bottom-start'
  | 'bottom-end'
  | 'top-start'
  | 'top-end';

// ─── Dropdown (generic floating container) ──────────────────────────────────

export interface DropdownProps {
  /** Element that triggers the dropdown on click */
  trigger: ReactNode;
  /** Dropdown content */
  children: ReactNode;
  /** Controlled open state */
  open?: boolean;
  /** Called when open state changes */
  onOpenChange?: (open: boolean) => void;
  /** Placement relative to trigger (default: bottom-start) */
  placement?: DropdownPlacement;
  /** className on trigger wrapper */
  className?: string;
  /** className on floating panel */
  contentClassName?: string;
}

export function Dropdown({
  trigger,
  children,
  open: controlledOpen,
  onOpenChange,
  placement = 'bottom-start',
  className,
  contentClassName,
}: DropdownProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;

  const triggerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const setOpen = useCallback(
    (v: boolean) => {
      if (controlledOpen === undefined) setUncontrolledOpen(v);
      onOpenChange?.(v);
    },
    [controlledOpen, onOpenChange],
  );

  // Position panel relative to trigger (direct DOM update)
  useEffect(() => {
    const p = panelRef.current;
    const t = triggerRef.current;
    if (!open || !p || !t) return;

    const tR = t.getBoundingClientRect();
    const pR = p.getBoundingClientRect();

    let x = placement.endsWith('end') ? tR.right - pR.width : tR.left;
    let y = placement.startsWith('top')
      ? tR.top - pR.height - 4
      : tR.bottom + 4;

    // Clamp to viewport
    if (x + pR.width > window.innerWidth - 8)
      x = window.innerWidth - pR.width - 8;
    if (y + pR.height > window.innerHeight - 8)
      y = window.innerHeight - pR.height - 8;
    if (x < 8) x = 8;
    if (y < 8) y = 8;

    p.style.left = `${x}px`;
    p.style.top = `${y}px`;
  }, [open, placement]);

  // Close on outside click + escape
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (triggerRef.current?.contains(e.target as Node)) return;
      if (panelRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, setOpen]);

  return (
    <>
      <div
        ref={triggerRef}
        className={cn('inline-flex', className)}
        onClick={() => setOpen(!open)}
      >
        {trigger}
      </div>
      {open &&
        createPortal(
          <div
            ref={panelRef}
            className={cn('fixed z-[9999]', contentClassName)}
            style={{ left: -9999, top: -9999 }}
          >
            {children}
          </div>,
          document.body,
        )}
    </>
  );
}

// ─── DropdownMenu types ─────────────────────────────────────────────────────

export interface DropdownMenuItem {
  key: string;
  label: ReactNode;
  icon?: ReactNode;
  disabled?: boolean;
  /** If true, rendered with active/selected highlight */
  active?: boolean;
  variant?: 'default' | 'danger';
  onClick?: () => void;
  /** Nested submenu items (appears on hover to the side) */
  children?: DropdownMenuItem[];
}

export type DropdownMenuEntry = DropdownMenuItem | 'separator';

export interface DropdownMenuProps {
  /** Element that triggers the menu on click */
  trigger: ReactNode;
  /** Menu items */
  items: DropdownMenuEntry[];
  /** Side panel items — rendered as a separate block beside the main menu */
  aside?: DropdownMenuEntry[];
  /** Title shown above the aside panel */
  asideTitle?: string;
  /** Called when a menu item is selected */
  onSelect?: (key: string) => void;
  placement?: DropdownPlacement;
  /** className on trigger wrapper */
  className?: string;
}

// ─── MenuPanel (internal) ───────────────────────────────────────────────────

function MenuPanel({
  items,
  title,
  onSelect,
}: {
  items: DropdownMenuEntry[];
  title?: string;
  onSelect: (key: string) => void;
}) {
  return (
    <div className="bg-surface border border-border-light shadow-lg py-1 min-w-[180px] text-sm">
      {title && (
        <div className="px-3 py-1.5 text-xs font-medium text-text-sub uppercase tracking-wide">
          {title}
        </div>
      )}
      {items.map((entry, i) => {
        if (entry === 'separator') {
          return (
            <div key={`sep-${i}`} className="border-t border-border-divider my-1" />
          );
        }
        return (
          <MenuItemEl key={entry.key} item={entry} onSelect={onSelect} />
        );
      })}
    </div>
  );
}

// ─── MenuItemEl (internal) ──────────────────────────────────────────────────

function MenuItemEl({
  item,
  onSelect,
}: {
  item: DropdownMenuItem;
  onSelect: (key: string) => void;
}) {
  const [showSub, setShowSub] = useState(false);
  const subRef = useRef<HTMLDivElement>(null);
  const hasChildren = item.children && item.children.length > 0;

  // Adjust submenu side to fit viewport (direct DOM update)
  useEffect(() => {
    const el = subRef.current;
    if (!showSub || !el) return;
    const rect = el.getBoundingClientRect();
    if (rect.right > window.innerWidth - 8) {
      el.style.left = '';
      el.style.right = '100%';
      el.style.marginLeft = '';
      el.style.marginRight = '0.25rem';
    } else {
      el.style.left = '100%';
      el.style.right = '';
      el.style.marginLeft = '0.25rem';
      el.style.marginRight = '';
    }
  }, [showSub]);

  return (
    <div
      className="relative"
      onMouseEnter={hasChildren ? () => setShowSub(true) : undefined}
      onMouseLeave={hasChildren ? () => setShowSub(false) : undefined}
    >
      <button
        type="button"
        disabled={item.disabled}
        className={cn(
          'w-full text-left px-3 py-2 flex items-center gap-2.5 transition-colors',
          item.disabled
            ? 'text-text-muted cursor-default'
            : 'hover:bg-surface-muted cursor-pointer',
          item.variant === 'danger' &&
            !item.disabled &&
            'text-error hover:bg-error-bg',
          item.active && !item.disabled && 'text-info font-medium',
          !item.active && item.variant !== 'danger' && !item.disabled && 'text-text-main',
        )}
        onClick={
          item.disabled
            ? undefined
            : () => {
                if (!hasChildren) {
                  item.onClick?.();
                  onSelect(item.key);
                }
              }
        }
      >
        {item.icon}
        <span className="flex-1 truncate">{item.label}</span>
        {hasChildren && <ChevronRight className="w-3 h-3 shrink-0 text-text-sub" />}
      </button>

      {/* Submenu */}
      {hasChildren && showSub && (
        <div
          ref={subRef}
          className="absolute top-0 z-[1]"
          style={{ left: '100%', marginLeft: '0.25rem' }}
        >
          <MenuPanel items={item.children!} onSelect={onSelect} />
        </div>
      )}
    </div>
  );
}

// ─── DropdownMenu ───────────────────────────────────────────────────────────

export function DropdownMenu({
  trigger,
  items,
  aside,
  asideTitle,
  onSelect,
  placement = 'bottom-start',
  className,
}: DropdownMenuProps) {
  const [open, setOpen] = useState(false);

  const handleSelect = useCallback(
    (key: string) => {
      onSelect?.(key);
      setOpen(false);
    },
    [onSelect],
  );

  return (
    <Dropdown
      trigger={trigger}
      open={open}
      onOpenChange={setOpen}
      placement={placement}
      className={className}
      contentClassName="flex items-start gap-1"
    >
      {/* Main menu panel */}
      <MenuPanel items={items} onSelect={handleSelect} />

      {/* Aside panel (separate block beside the main menu) */}
      {aside && aside.length > 0 && (
        <MenuPanel items={aside} title={asideTitle} onSelect={handleSelect} />
      )}
    </Dropdown>
  );
}

// ─── ContextMenu (right-click menu, positioned at x/y) ─────────────────────

export interface ContextMenuProps {
  x: number;
  y: number;
  items: DropdownMenuEntry[];
  /** Side panel items */
  aside?: DropdownMenuEntry[];
  asideTitle?: string;
  onSelect?: (key: string) => void;
  onClose: () => void;
}

export function ContextMenu({
  x,
  y,
  items,
  aside,
  asideTitle,
  onSelect,
  onClose,
}: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Adjust position to stay within viewport (direct DOM update)
  useEffect(() => {
    const el = menuRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    let nx = x;
    let ny = y;
    if (x + rect.width > window.innerWidth - 8)
      nx = window.innerWidth - rect.width - 8;
    if (y + rect.height > window.innerHeight - 8)
      ny = window.innerHeight - rect.height - 8;
    if (nx < 8) nx = 8;
    if (ny < 8) ny = 8;
    el.style.left = `${nx}px`;
    el.style.top = `${ny}px`;
  }, [x, y]);

  // Close on escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleSelect = useCallback(
    (key: string) => {
      onSelect?.(key);
      onClose();
    },
    [onSelect, onClose],
  );

  return createPortal(
    <div className="fixed inset-0 z-[9999]" onMouseDown={onClose}>
      <div
        ref={menuRef}
        className="fixed z-[10000] flex items-start gap-1"
        style={{ left: x, top: y }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <MenuPanel items={items} onSelect={handleSelect} />
        {aside && aside.length > 0 && (
          <MenuPanel
            items={aside}
            title={asideTitle}
            onSelect={handleSelect}
          />
        )}
      </div>
    </div>,
    document.body,
  );
}

// ─── ContextMenuArea (wrapper for right-click + long-press) ─────────────────

export interface ContextMenuAreaProps {
  /** Menu items to show. Can be a function receiving position */
  items: DropdownMenuEntry[];
  /** Side panel items */
  aside?: DropdownMenuEntry[];
  asideTitle?: string;
  onSelect?: (key: string) => void;
  children: ReactNode;
  className?: string;
  /** Long press duration in ms (default: 500) */
  longPressDuration?: number;
}

export function ContextMenuArea({
  items,
  aside,
  asideTitle,
  onSelect,
  children,
  className,
  longPressDuration = 500,
}: ContextMenuAreaProps) {
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  const lpRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearLp = useCallback(() => {
    if (lpRef.current) {
      clearTimeout(lpRef.current);
      lpRef.current = null;
    }
  }, []);

  return (
    <div
      className={className}
      onContextMenu={(e) => {
        e.preventDefault();
        setMenu({ x: e.clientX, y: e.clientY });
      }}
      onTouchStart={(e) => {
        const touch = e.touches[0];
        lpRef.current = setTimeout(
          () => setMenu({ x: touch.clientX, y: touch.clientY }),
          longPressDuration,
        );
      }}
      onTouchEnd={clearLp}
      onTouchMove={clearLp}
    >
      {children}
      {menu && (
        <ContextMenu
          x={menu.x}
          y={menu.y}
          items={items}
          aside={aside}
          asideTitle={asideTitle}
          onSelect={onSelect}
          onClose={() => setMenu(null)}
        />
      )}
    </div>
  );
}
