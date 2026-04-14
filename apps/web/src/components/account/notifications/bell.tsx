'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, X, ChevronDown, Volume2, VolumeX, Settings, CheckCheck, PanelRightOpen, PanelRightClose, Sun, Moon } from 'lucide-react';
import { notificationApi } from '@/lib/api/notification';
import { useNotificationSocket } from '@/lib/hooks/use-notification-socket';
import { useSoundMute } from '@/lib/hooks/use-sound-mute';
import { playSound, isReminderEnabled } from '@/lib/sound';
import { getActiveConversation } from '@/lib/active-conversation';
import { useSidebar } from '@/components/account/layout/sidebar-context';
import { useTheme } from '@/lib/theme';
import type { NotificationRecord } from '@/lib/api/types';
import type { ListCache } from './types';
import { CHAT_NOTIFICATION_TYPES, NOTIFICATION_TYPE_CONFIG, getTimeAgo } from './constants';
import { NotificationIcon } from './icon';

const REMINDER_MS = 5 * 60 * 1000;
const PANEL_WIDTH = 350;

/** Minimum mobile sheet height: header(52) + one item(~72) + footer(48) */
const MOBILE_MIN_H = 172;
/** Mobile sheet snaps to this fraction of viewport on release */
const MOBILE_SNAP_RATIO = 0.75;

function isNotificationNavigable(n: NotificationRecord): boolean {
  return !!NOTIFICATION_TYPE_CONFIG[n.type]?.href;
}

export function NotificationBell() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [soundMuted, toggleMute] = useSoundMute('notification');
  const { theme, toggle: toggleTheme } = useTheme();
  const { notifOpen: open, notifMode, setNotifOpen, setNotifMode } = useSidebar();
  const [closing, setClosing] = useState(false);

  // ── Queries ──────────────────────────────────────────────────
  const { data: countData } = useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: async () => {
      const { data } = await notificationApi.unreadCount();
      return data;
    },
    refetchInterval: 30_000,
  });

  const { data: listData } = useQuery({
    queryKey: ['notifications-unread-list'],
    queryFn: async () => {
      const { data } = await notificationApi.list({ limit: 20, unreadOnly: true });
      return data;
    },
    enabled: open,
    staleTime: 0,
  });

  const unreadCount = countData?.count ?? 0;
  const notifications = listData?.data ?? [];

  // ── Sound reminder (re-ping every 5 min while unread) ────────
  const reminderRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearReminder = useCallback(() => {
    if (reminderRef.current) {
      clearTimeout(reminderRef.current);
      reminderRef.current = null;
    }
  }, []);

  const scheduleReminder = useCallback(() => {
    clearReminder();
    reminderRef.current = setTimeout(function remind() {
      const current = queryClient.getQueryData<{ count: number }>(['notifications-unread-count']);
      if (current && current.count > 0) {
        if (isReminderEnabled()) playSound('notification');
        reminderRef.current = setTimeout(remind, REMINDER_MS);
      }
    }, REMINDER_MS);
  }, [queryClient, clearReminder]);

  const hasUnread = unreadCount > 0;
  useEffect(() => {
    if (hasUnread && !soundMuted) scheduleReminder();
    else clearReminder();
  }, [hasUnread, soundMuted, scheduleReminder, clearReminder]);

  useEffect(() => clearReminder, [clearReminder]);

  // ── Real-time via WebSocket ──────────────────────────────────
  useNotificationSocket(
    useCallback((notification: NotificationRecord) => {
      if (
        CHAT_NOTIFICATION_TYPES.has(notification.type) &&
        notification.targetId === getActiveConversation()
      ) {
        notificationApi.markAsRead(notification.id);
        return;
      }

      queryClient.setQueryData<ListCache>(
        ['notifications-unread-list'],
        (old) => {
          if (!old) return { data: [notification], overallCount: 1 };
          return { ...old, data: [notification, ...old.data], overallCount: old.overallCount + 1 };
        },
      );

      playSound('notification');
      scheduleReminder();
    }, [queryClient, scheduleReminder]),
    useCallback((delta: number) => {
      queryClient.setQueryData<{ count: number }>(['notifications-unread-count'], (old) => ({
        count: Math.max(0, (old?.count ?? 0) + delta),
      }));
    }, [queryClient]),
  );

  // ── Optimistic mark single as read (with exit animation) ─────
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());

  const markRead = useCallback((id: string) => {
    setRemovingIds((prev) => new Set(prev).add(id));
    queryClient.setQueryData<{ count: number }>(['notifications-unread-count'], (old) => ({
      count: Math.max(0, (old?.count ?? 1) - 1),
    }));
    setTimeout(() => {
      queryClient.setQueryData<ListCache>(['notifications-unread-list'], (old) => {
        if (!old) return old;
        const filtered = old.data.filter((n) => n.id !== id);
        return { ...old, data: filtered, overallCount: Math.max(0, old.overallCount - 1) };
      });
      setRemovingIds((prev) => { const next = new Set(prev); next.delete(id); return next; });
    }, 400);
    notificationApi.markAsRead(id);
  }, [queryClient]);

  // ── Optimistic mark all as read ──────────────────────────────
  const [markingAll, setMarkingAll] = useState(false);

  const markAllRead = useCallback(() => {
    const ids = notifications.map((n) => n.id);
    if (ids.length === 0) return;
    setMarkingAll(true);
    setRemovingIds(new Set(ids));

    const totalMs = (ids.length - 1) * 50 + 400;
    setTimeout(() => {
      queryClient.setQueryData(['notifications-unread-count'], { count: 0 });
      queryClient.setQueryData<ListCache>(['notifications-unread-list'], (old) => {
        if (!old) return old;
        return { ...old, data: [], overallCount: 0 };
      });
      setRemovingIds(new Set());
      setMarkingAll(false);
    }, totalMs);

    notificationApi.markAllAsRead();
  }, [queryClient, notifications]);

  // ── Expand / Collapse notification body ──────────────────────
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // ── Open / Close panel ───────────────────────────────────────
  const handleClose = useCallback(() => {
    if (notifMode === 'dock') {
      setNotifOpen(false);
      setExpandedIds(new Set());
      return;
    }
    setClosing(true);
    setTimeout(() => { setNotifOpen(false); setClosing(false); setExpandedIds(new Set()); }, 250);
  }, [notifMode, setNotifOpen]);

  const handleToggle = useCallback(() => {
    if (open) handleClose();
    else setNotifOpen(true);
  }, [open, handleClose, setNotifOpen]);

  // ── Navigate to notification target ──────────────────────────
  const handleNavigate = useCallback((n: NotificationRecord) => {
    const config = NOTIFICATION_TYPE_CONFIG[n.type];
    const href = config?.href?.(n);
    markRead(n.id);
    handleClose();
    if (href) router.push(href);
  }, [markRead, handleClose, router]);

  // ── Outside click (overlay mode only) ────────────────────────
  const desktopPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || notifMode === 'dock') return;
    const handle = (e: MouseEvent) => {
      if (triggerRef.current?.contains(e.target as Node)) return;
      if (desktopPanelRef.current?.contains(e.target as Node)) return;
      handleClose();
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open, notifMode, handleClose]);

  // ── Escape key ───────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const handle = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose(); };
    document.addEventListener('keydown', handle);
    return () => document.removeEventListener('keydown', handle);
  }, [open, handleClose]);

  // ── Lock body scroll on mobile when open ─────────────────────
  useEffect(() => {
    if (!open) return;
    const mq = window.matchMedia('(max-width: 1023px)');
    if (mq.matches) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [open]);

  // ── Desktop animations (overlay only) ────────────────────────
  const desktopPanelAnim = notifMode === 'dock'
    ? ''
    : closing
      ? 'animate-[notification-slide-out-right_250ms_ease-in_forwards]'
      : 'animate-[notification-slide-in-right_250ms_ease-out]';

  const overlayAnimation = closing
    ? 'animate-[fade-out_200ms_ease-in_forwards]'
    : 'animate-[fade-in_200ms_ease-out]';

  // ── Toggle mode ──────────────────────────────────────────────
  const handleToggleMode = useCallback(() => {
    setNotifMode(notifMode === 'overlay' ? 'dock' : 'overlay');
  }, [notifMode, setNotifMode]);

  // ── Shared panel header ──────────────────────────────────────
  const panelHeader = (
    <div className="flex items-center justify-between px-3 py-2.5 border-b border-border-light flex-shrink-0">
      <span className="text-sm font-medium text-text-main">Уведомления</span>
      <div className="flex items-center gap-1.5">
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={markAllRead}
            disabled={markingAll}
            className="text-[11px] text-brand-red hover:underline cursor-pointer disabled:opacity-50"
          >
            Прочитать все
          </button>
        )}
        <button
          type="button"
          onClick={handleClose}
          className="text-text-sub hover:text-text-main cursor-pointer p-1"
          aria-label="Закрыть"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );

  // ── Quick actions footer ─────────────────────────────────────
  const panelFooter = (
    <div className="flex items-center justify-between px-3 py-2 border-t border-border-light flex-shrink-0 bg-surface-secondary">
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={toggleMute}
          className="p-1.5 text-text-sub hover:text-text-main transition-colors cursor-pointer"
          aria-label={soundMuted ? 'Включить звук' : 'Выключить звук'}
          title={soundMuted ? 'Включить звук' : 'Выключить звук'}
        >
          {soundMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
        </button>
        <button
          type="button"
          onClick={toggleTheme}
          className="p-1.5 text-text-sub hover:text-text-main transition-colors cursor-pointer"
          title={theme === 'light' ? 'Тёмная тема' : 'Светлая тема'}
        >
          {theme === 'light' ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
        </button>
      </div>
      <div className="flex items-center gap-1">
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={markAllRead}
            disabled={markingAll}
            className="p-1.5 text-text-sub hover:text-text-main transition-colors cursor-pointer disabled:opacity-50"
            title="Прочитать все"
          >
            <CheckCheck className="w-3.5 h-3.5" />
          </button>
        )}
        {/* Desktop-only: toggle overlay/dock */}
        <button
          type="button"
          onClick={handleToggleMode}
          className="hidden lg:block p-1.5 text-text-sub hover:text-text-main transition-colors cursor-pointer"
          title={notifMode === 'overlay' ? 'Закрепить панель' : 'Открепить панель'}
        >
          {notifMode === 'overlay'
            ? <PanelRightOpen className="w-3.5 h-3.5" />
            : <PanelRightClose className="w-3.5 h-3.5" />}
        </button>
        <button
          type="button"
          onClick={() => { handleClose(); router.push('/account/notifications'); }}
          className="p-1.5 text-text-sub hover:text-text-main transition-colors cursor-pointer"
          title="Настройки"
        >
          <Settings className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );

  const notificationList = (
    <NotificationList
      notifications={notifications}
      removingIds={removingIds}
      markingAll={markingAll}
      expandedIds={expandedIds}
      onToggleExpand={toggleExpand}
      onMarkRead={markRead}
      onNavigate={handleNavigate}
    />
  );

  return (
    <>
      {/* Bell trigger */}
      <button
        ref={triggerRef}
        type="button"
        onClick={handleToggle}
        aria-label="Уведомления"
        className="relative cursor-pointer group"
      >
        <Bell
          className={`w-6 h-6 text-warning transition-transform duration-200 ${open ? 'scale-110' : 'group-hover:scale-110'}`}
          strokeWidth={1.5}
        />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -left-1.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-brand-red text-text-on-brand text-[10px] font-medium px-1 leading-none animate-[badge-pop_300ms_ease-out]">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Mobile: resizable bottom sheet */}
      {open && (
        <MobileSheet
          closing={closing}
          overlayAnimation={overlayAnimation}
          onClose={handleClose}
          header={panelHeader}
          footer={panelFooter}
          itemCount={notifications.length}
        >
          {notificationList}
        </MobileSheet>
      )}

      {/* Desktop overlay mode: portal-based right-side slide panel */}
      {open && notifMode === 'overlay' && createPortal(
        <>
          <div
            className={`hidden lg:block fixed inset-0 z-[9999] bg-dark-deep/30 ${overlayAnimation}`}
            onClick={handleClose}
          />
          <div
            ref={desktopPanelRef}
            className={`hidden lg:flex fixed top-0 right-0 bottom-0 z-[10000] flex-col bg-surface border-l border-border-light shadow-lg ${desktopPanelAnim}`}
            style={{ width: PANEL_WIDTH }}
          >
            {panelHeader}
            <div className="flex-1 overflow-y-auto">
              {notificationList}
            </div>
            {panelFooter}
          </div>
        </>,
        document.body,
      )}
    </>
  );
}

// ── Dock Panel (rendered inline in account layout) ─────────────

export function NotificationDockPanel() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { notifOpen: open, notifMode, setNotifOpen, setNotifMode } = useSidebar();
  const [soundMuted, toggleMute] = useSoundMute('notification');
  const { theme, toggle: toggleTheme } = useTheme();

  const { data: listData } = useQuery({
    queryKey: ['notifications-unread-list'],
    queryFn: async () => {
      const { data } = await notificationApi.list({ limit: 20, unreadOnly: true });
      return data;
    },
    enabled: open && notifMode === 'dock',
    staleTime: 0,
  });

  const { data: countData } = useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: async () => {
      const { data } = await notificationApi.unreadCount();
      return data;
    },
    refetchInterval: 30_000,
  });

  const unreadCount = countData?.count ?? 0;
  const notifications = listData?.data ?? [];

  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());
  const [markingAll, setMarkingAll] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const markRead = useCallback((id: string) => {
    setRemovingIds((prev) => new Set(prev).add(id));
    queryClient.setQueryData<{ count: number }>(['notifications-unread-count'], (old) => ({
      count: Math.max(0, (old?.count ?? 1) - 1),
    }));
    setTimeout(() => {
      queryClient.setQueryData<ListCache>(['notifications-unread-list'], (old) => {
        if (!old) return old;
        const filtered = old.data.filter((n) => n.id !== id);
        return { ...old, data: filtered, overallCount: Math.max(0, old.overallCount - 1) };
      });
      setRemovingIds((prev) => { const next = new Set(prev); next.delete(id); return next; });
    }, 400);
    notificationApi.markAsRead(id);
  }, [queryClient]);

  const markAllRead = useCallback(() => {
    const ids = notifications.map((n) => n.id);
    if (ids.length === 0) return;
    setMarkingAll(true);
    setRemovingIds(new Set(ids));
    const totalMs = (ids.length - 1) * 50 + 400;
    setTimeout(() => {
      queryClient.setQueryData(['notifications-unread-count'], { count: 0 });
      queryClient.setQueryData<ListCache>(['notifications-unread-list'], (old) => {
        if (!old) return old;
        return { ...old, data: [], overallCount: 0 };
      });
      setRemovingIds(new Set());
      setMarkingAll(false);
    }, totalMs);
    notificationApi.markAllAsRead();
  }, [queryClient, notifications]);

  const toggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleNavigate = useCallback((n: NotificationRecord) => {
    const config = NOTIFICATION_TYPE_CONFIG[n.type];
    const href = config?.href?.(n);
    markRead(n.id);
    if (href) router.push(href);
  }, [markRead, router]);

  if (!open || notifMode !== 'dock') return null;

  return (
    <aside
      className="hidden lg:flex flex-col flex-shrink-0 bg-surface border-l border-border-light h-screen sticky top-0 overflow-hidden transition-[width] duration-200"
      style={{ width: PANEL_WIDTH }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-border-light flex-shrink-0">
        <span className="text-sm font-medium text-text-main">Уведомления</span>
        <div className="flex items-center gap-1.5">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllRead}
              disabled={markingAll}
              className="text-[11px] text-brand-red hover:underline cursor-pointer disabled:opacity-50"
            >
              Прочитать все
            </button>
          )}
          <button
            type="button"
            onClick={() => setNotifOpen(false)}
            className="text-text-sub hover:text-text-main cursor-pointer p-1"
            aria-label="Закрыть"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        <NotificationList
          notifications={notifications}
          removingIds={removingIds}
          markingAll={markingAll}
          expandedIds={expandedIds}
          onToggleExpand={toggleExpand}
          onMarkRead={markRead}
          onNavigate={handleNavigate}
        />
      </div>

      {/* Footer actions */}
      <div className="flex items-center justify-between px-3 py-2 border-t border-border-light flex-shrink-0 bg-surface-secondary">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={toggleMute}
            className="p-1.5 text-text-sub hover:text-text-main transition-colors cursor-pointer"
            title={soundMuted ? 'Включить звук' : 'Выключить звук'}
          >
            {soundMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
          <button
            type="button"
            onClick={toggleTheme}
            className="p-1.5 text-text-sub hover:text-text-main transition-colors cursor-pointer"
            title={theme === 'light' ? 'Тёмная тема' : 'Светлая тема'}
          >
            {theme === 'light' ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
          </button>
        </div>
        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllRead}
              disabled={markingAll}
              className="p-1.5 text-text-sub hover:text-text-main transition-colors cursor-pointer disabled:opacity-50"
              title="Прочитать все"
            >
              <CheckCheck className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setNotifMode('overlay')}
            className="p-1.5 text-text-sub hover:text-text-main transition-colors cursor-pointer"
            title="Открепить панель"
          >
            <PanelRightClose className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => { setNotifOpen(false); router.push('/account/notifications'); }}
            className="p-1.5 text-text-sub hover:text-text-main transition-colors cursor-pointer"
            title="Настройки"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}

// ─── Mobile Bottom Sheet with drag-resize ───────────────────────

function MobileSheet({
  closing,
  overlayAnimation,
  onClose,
  header,
  footer,
  children,
  itemCount,
}: {
  closing: boolean;
  overlayAnimation: string;
  onClose: () => void;
  header: React.ReactNode;
  footer: React.ReactNode;
  children: React.ReactNode;
  itemCount: number;
}) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<{ startY: number; startH: number } | null>(null);
  const [sheetH, setSheetH] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);

  const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
  const minH = MOBILE_MIN_H;
  const snapH = Math.round(vh * MOBILE_SNAP_RATIO);
  const maxH = vh;

  useEffect(() => {
    if (sheetH === null) {
      const initial = itemCount <= 1 ? minH : snapH;
      setSheetH(initial);
    }
  }, [sheetH, itemCount, minH, snapH]);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    dragState.current = { startY: touch.clientY, startH: sheetH ?? snapH };
    setDragging(true);
  }, [sheetH, snapH]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!dragState.current) return;
    const touch = e.touches[0];
    const dy = dragState.current.startY - touch.clientY;
    const newH = Math.max(minH, Math.min(maxH, dragState.current.startH + dy));
    setSheetH(newH);
  }, [minH, maxH]);

  const onTouchEnd = useCallback(() => {
    if (!dragState.current) return;
    const currentH = sheetH ?? snapH;
    dragState.current = null;
    setDragging(false);

    if (currentH < minH + 40) {
      onClose();
      return;
    }
    if (currentH > vh * 0.85) {
      setSheetH(maxH);
      return;
    }
    setSheetH(snapH);
  }, [sheetH, snapH, minH, maxH, vh, onClose]);

  const panelAnimation = closing
    ? 'animate-[notification-out_200ms_ease-in_forwards]'
    : (sheetH === null ? 'animate-[notification-in_250ms_ease-out]' : '');

  return (
    <div className="lg:hidden">
      <div
        className={`fixed inset-0 z-[9999] bg-dark-deep/40 ${overlayAnimation}`}
        onClick={onClose}
      />
      <div
        ref={sheetRef}
        className={`fixed inset-x-0 bottom-0 z-[10000] bg-surface flex flex-col ${panelAnimation}`}
        style={{
          height: sheetH ?? MOBILE_MIN_H,
          transition: dragging ? 'none' : 'height 250ms ease-out',
        }}
      >
        <div
          className="flex justify-center py-3 cursor-grab active:cursor-grabbing touch-none flex-shrink-0"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <div className="w-10 h-1 rounded-full bg-border-light" />
        </div>
        {header}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {children}
        </div>
        {footer}
      </div>
    </div>
  );
}

// ─── Notification List ───────────────────────────────────────────

function NotificationList({
  notifications,
  removingIds,
  markingAll,
  expandedIds,
  onToggleExpand,
  onMarkRead,
  onNavigate,
}: {
  notifications: NotificationRecord[];
  removingIds: Set<string>;
  markingAll: boolean;
  expandedIds: Set<string>;
  onToggleExpand: (id: string) => void;
  onMarkRead: (id: string) => void;
  onNavigate: (n: NotificationRecord) => void;
}) {
  if (notifications.length === 0) {
    return (
      <div className="px-4 py-12 text-center text-sm text-text-sub">
        Нет новых уведомлений
      </div>
    );
  }

  return (
    <>
      {notifications.map((n, i) => {
        const navigable = isNotificationNavigable(n);
        const isRemoving = removingIds.has(n.id);
        const isExpanded = expandedIds.has(n.id);
        return (
          <div
            key={n.id}
            className={`group/item border-b border-border-light/50 last:border-b-0 ${isRemoving
              ? 'animate-[notification-remove_400ms_ease-in-out_forwards] pointer-events-none'
              : 'animate-[notification-item_300ms_ease-out_both]'
              }`}
            style={{ animationDelay: `${isRemoving && markingAll ? i * 50 : isRemoving ? 0 : i * 50}ms` }}
          >
            <button
              type="button"
              onClick={() => navigable ? onNavigate(n) : onToggleExpand(n.id)}
              className="w-full flex items-start gap-2.5 text-left cursor-pointer px-3 py-2.5 hover:bg-surface-hover transition-colors"
            >
              <div className="flex-shrink-0 mt-0.5">
                <NotificationIcon type={n.type} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-text-main leading-tight">
                  {n.title}
                </p>
                <p className={`text-xs text-text-sub mt-0.5 leading-relaxed ${isExpanded ? '' : 'line-clamp-2'}`}>
                  {n.body}
                </p>
                <span className="text-[10px] text-text-sub/60 mt-1 block">
                  {getTimeAgo(n.createdAt)}
                </span>
              </div>
              {n.body && n.body.length > 60 && (
                <ChevronDown
                  className={`w-3.5 h-3.5 text-text-sub/40 flex-shrink-0 mt-1.5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''
                    }`}
                  onClick={(e) => { e.stopPropagation(); onToggleExpand(n.id); }}
                />
              )}
            </button>
            <div className="flex items-center justify-end px-3 pb-1.5 -mt-0.5">
              <button
                type="button"
                onClick={() => onMarkRead(n.id)}
                className="text-[10px] text-text-sub/50 hover:text-brand-red transition-colors cursor-pointer"
              >
                Прочитано
              </button>
            </div>
          </div>
        );
      })}
    </>
  );
}
