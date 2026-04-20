'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, X, ChevronDown, CheckCheck, PanelRightOpen, PanelRightClose, BellOff } from 'lucide-react';
import { notificationApi } from '@/lib/api/notification';
import { useNotificationSocket } from '@/lib/hooks/use-notification-socket';
import { useAppSelector, useAppDispatch } from '@/store/index';
import { selectSound, selectLayout, setNotifPanelOpen, setNotifPanelMode } from '@/store/preferences-slice';
import type { NotifPanelMode } from '@/store/preferences-slice';
import { playSound, isReminderEnabled } from '@/lib/sound';
import { getActiveConversation } from '@/lib/active-conversation';
import type { NotificationRecord } from '@/lib/api/types';
import type { ListCache } from './types';
import { formatTimeAgo } from '@asko/shared/client';
import { NotificationGroup } from '@asko/shared/client';
import { CHAT_NOTIFICATION_TYPES, NOTIFICATION_TYPE_CONFIG, GROUP_LABELS, getNotificationGroup, URGENCY_BORDER, URGENCY_BORDER_DEFAULT, URGENCY_LABEL } from './constants';
import { NotificationIcon } from './icon';

type ViewMode = 'unread' | 'all';
const HISTORY_PAGE_SIZE = 20;

const GROUP_OPTIONS = [
  { value: '', label: 'Все' },
  ...Object.values(NotificationGroup).map(g => ({ value: g, label: GROUP_LABELS[g] ?? g })),
];

const REMINDER_MS = 5 * 60 * 1000;
const PANEL_WIDTH = 350;

async function markReadAndInvalidate(queryClient: ReturnType<typeof useQueryClient>, id: string) {
  await notificationApi.markAsRead(id);
  queryClient.invalidateQueries({ queryKey: ['notifications-history'] });
  queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
  queryClient.invalidateQueries({ queryKey: ['notifications-unread-list'] });
}

function navigateToNotification(
  n: NotificationRecord,
  markRead: (id: string) => void,
  router: ReturnType<typeof useRouter>,
  onAfter?: () => void,
) {
  const config = NOTIFICATION_TYPE_CONFIG[n.type];
  const href = config?.href?.(n);
  if (!n.isRead) markRead(n.id);
  if (href) { router.push(href); onAfter?.(); }
}

function NotificationViewTabs({
  viewMode,
  unreadCount,
  onSelectUnread,
  onSelectAll,
}: {
  viewMode: ViewMode;
  unreadCount: number;
  onSelectUnread: () => void;
  onSelectAll: () => void;
}) {
  return (
    <div className="flex px-4 gap-4">
      <button
        type="button"
        onClick={onSelectUnread}
        className={`pb-2 text-[12px] font-medium border-b-2 transition-colors cursor-pointer ${
          viewMode === 'unread'
            ? 'border-brand-red text-brand-red'
            : 'border-transparent text-text-sub hover:text-text-main'
        }`}
      >
        Непрочитанные{unreadCount > 0 ? ` (${unreadCount})` : ''}
      </button>
      <button
        type="button"
        onClick={onSelectAll}
        className={`pb-2 text-[12px] font-medium border-b-2 transition-colors cursor-pointer ${
          viewMode === 'all'
            ? 'border-brand-red text-brand-red'
            : 'border-transparent text-text-sub hover:text-text-main'
        }`}
      >
        Все
      </button>
    </div>
  );
}

/** Minimum mobile sheet height: header(52) + one item(~72) + footer(48) */
const MOBILE_MIN_H = 172;
/** Mobile sheet snaps to this fraction of viewport on release */
const MOBILE_SNAP_RATIO = 0.75;

function useToggleSet() {
  const [set, setSet] = useState<Set<string>>(new Set());
  const toggle = useCallback((key: string) => {
    setSet(prev => { const next = new Set(prev); if (next.has(key)) next.delete(key); else next.add(key); return next; });
  }, []);
  const clear = useCallback(() => setSet(new Set()), []);
  return [set, toggle, clear] as const;
}

function useNotificationActions(queryClient: ReturnType<typeof useQueryClient>, notifications: NotificationRecord[], router: ReturnType<typeof useRouter>) {
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());
  const [markingAll, setMarkingAll] = useState(false);
  const [expandedIds, toggleExpand, clearExpanded] = useToggleSet();
  const [expandedGroups, toggleGroup, clearGroups] = useToggleSet();

  const clearAll = useCallback(() => { clearExpanded(); clearGroups(); }, [clearExpanded, clearGroups]);

  const markRead = useCallback((id: string) => {
    setRemovingIds(prev => new Set(prev).add(id));
    queryClient.setQueryData<{ count: number }>(['notifications-unread-count'], old => ({
      count: Math.max(0, (old?.count ?? 1) - 1),
    }));
    setTimeout(() => {
      queryClient.setQueryData<ListCache>(['notifications-unread-list'], old => {
        if (!old) return old;
        const filtered = old.data.filter(n => n.id !== id);
        return { ...old, data: filtered, overallCount: Math.max(0, old.overallCount - 1) };
      });
      setRemovingIds(prev => { const next = new Set(prev); next.delete(id); return next; });
    }, 400);
    notificationApi.markAsRead(id);
  }, [queryClient]);

  const markAllRead = useCallback(() => {
    const ids = notifications.map(n => n.id);
    if (ids.length === 0) return;
    setMarkingAll(true);
    setRemovingIds(new Set(ids));
    const totalMs = (ids.length - 1) * 50 + 400;
    setTimeout(() => {
      queryClient.setQueryData(['notifications-unread-count'], { count: 0 });
      queryClient.setQueryData<ListCache>(['notifications-unread-list'], old => {
        if (!old) return old;
        return { ...old, data: [], overallCount: 0 };
      });
      setRemovingIds(new Set());
      setMarkingAll(false);
    }, totalMs);
    notificationApi.markAllAsRead();
  }, [queryClient, notifications]);

  const handleNavigate = useCallback((n: NotificationRecord) => {
    const config = NOTIFICATION_TYPE_CONFIG[n.type];
    const href = config?.href?.(n);
    markRead(n.id);
    if (href) router.push(href);
  }, [markRead, router]);

  return { removingIds, markingAll, expandedIds, expandedGroups, toggleExpand, toggleGroup, markRead, markAllRead, handleNavigate, clearAll };
}

function isNotificationNavigable(n: NotificationRecord): boolean {
  return !!NOTIFICATION_TYPE_CONFIG[n.type]?.href;
}

export function NotificationBell() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const soundMuted = useAppSelector(selectSound).notificationMuted;
  const bellDispatch = useAppDispatch();
  const { notifPanelOpen: open, notifPanelMode: notifMode } = useAppSelector(selectLayout);
  const setNotifOpen = (v: boolean) => bellDispatch(setNotifPanelOpen(v));
  const setNotifMode = (m: NotifPanelMode) => bellDispatch(setNotifPanelMode(m));
  const [closing, setClosing] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('unread');
  const [historyPage, setHistoryPage] = useState(1);
  const [historyGroup, setHistoryGroup] = useState('');

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
    enabled: open && viewMode === 'unread',
    staleTime: 0,
  });

  const { data: historyData } = useQuery({
    queryKey: ['notifications-history', historyPage, historyGroup],
    queryFn: async () => {
      const { data } = await notificationApi.list({
        page: historyPage,
        limit: HISTORY_PAGE_SIZE,
        group: historyGroup || undefined,
      });
      return data;
    },
    enabled: open && viewMode === 'all',
    staleTime: 0,
  });

  const unreadCount = countData?.count ?? 0;
  const notifications = listData?.data ?? [];
  const historyNotifications = historyData?.data ?? [];
  const historyTotalPages = Math.ceil((historyData?.overallCount ?? 0) / HISTORY_PAGE_SIZE);

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

  const actions = useNotificationActions(queryClient, notifications, router);
  const { removingIds, markingAll, expandedIds, expandedGroups, toggleExpand, toggleGroup, markRead, markAllRead } = actions;

  // ── Open / Close panel ───────────────────────────────────────
  const handleClose = useCallback(() => {
    if (notifMode === 'dock') {
      setNotifOpen(false);
      actions.clearAll();
      setViewMode('unread');
      setHistoryPage(1);
      setHistoryGroup('');
      return;
    }
    setClosing(true);
    setTimeout(() => { setNotifOpen(false); setClosing(false); actions.clearAll(); setViewMode('unread'); setHistoryPage(1); setHistoryGroup(''); }, 250);
  }, [notifMode, setNotifOpen, actions]);

  const handleToggle = useCallback(() => {
    if (open) handleClose();
    else setNotifOpen(true);
  }, [open, handleClose, setNotifOpen]);

  // ── Navigate to notification target (closes overlay panel) ──
  const handleNavigate = useCallback((n: NotificationRecord) => {
    actions.handleNavigate(n);
    handleClose();
  }, [actions, handleClose]);

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

  // ── History view handlers ────────────────────────────────────
  const handleHistoryMarkRead = useCallback((id: string) => markReadAndInvalidate(queryClient, id), [queryClient]);
  const handleHistoryNavigate = useCallback((n: NotificationRecord) => navigateToNotification(n, handleHistoryMarkRead, router, handleClose), [handleHistoryMarkRead, router, handleClose]);

  // ── Shared panel header ──────────────────────────────────────
  const panelHeader = (
    <div className="flex flex-col border-b border-border-light flex-shrink-0">
      <div className="flex items-center justify-between px-4 py-3">
        <span className="text-sm font-medium text-text-main">Уведомления</span>
        <div className="flex items-center gap-2">
          {viewMode === 'unread' && unreadCount > 0 && (
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
      <NotificationViewTabs
        viewMode={viewMode}
        unreadCount={unreadCount}
        onSelectUnread={() => setViewMode('unread')}
        onSelectAll={() => { setViewMode('all'); setHistoryPage(1); }}
      />
    </div>
  );

  // ── Simplified footer: mark-all + dock/overlay toggle ───────
  const panelFooter = (
    <div className="flex items-center justify-between px-3 py-2 border-t border-border-light flex-shrink-0 bg-surface-secondary">
      <span className="text-[11px] text-text-sub">
        {unreadCount > 0 ? `${unreadCount} непрочитанных` : 'Нет новых'}
      </span>
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
      </div>
    </div>
  );

  const notificationList = viewMode === 'unread' ? (
    <NotificationList
      notifications={notifications}
      removingIds={removingIds}
      markingAll={markingAll}
      expandedIds={expandedIds}
      expandedGroups={expandedGroups}
      onToggleExpand={toggleExpand}
      onToggleGroup={toggleGroup}
      onMarkRead={markRead}
      onNavigate={handleNavigate}
    />
  ) : (
    <HistoryList
      notifications={historyNotifications}
      page={historyPage}
      totalPages={historyTotalPages}
      group={historyGroup}
      onPageChange={setHistoryPage}
      onGroupChange={setHistoryGroup}
      onMarkRead={handleHistoryMarkRead}
      onNavigate={handleHistoryNavigate}
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
  const bellDispatch = useAppDispatch();
  const { notifPanelOpen: open, notifPanelMode: notifMode } = useAppSelector(selectLayout);
  const setNotifOpen = (v: boolean) => bellDispatch(setNotifPanelOpen(v));
  const setNotifMode = (m: NotifPanelMode) => bellDispatch(setNotifPanelMode(m));
  const [dockViewMode, setDockViewMode] = useState<ViewMode>('unread');
  const [dockHistoryPage, setDockHistoryPage] = useState(1);
  const [dockHistoryGroup, setDockHistoryGroup] = useState('');

  const { data: listData } = useQuery({
    queryKey: ['notifications-unread-list'],
    queryFn: async () => {
      const { data } = await notificationApi.list({ limit: 20, unreadOnly: true });
      return data;
    },
    enabled: open && notifMode === 'dock' && dockViewMode === 'unread',
    staleTime: 0,
  });

  const { data: dockHistoryData } = useQuery({
    queryKey: ['notifications-history', 'dock', dockHistoryPage, dockHistoryGroup],
    queryFn: async () => {
      const { data } = await notificationApi.list({
        page: dockHistoryPage,
        limit: HISTORY_PAGE_SIZE,
        group: dockHistoryGroup || undefined,
      });
      return data;
    },
    enabled: open && notifMode === 'dock' && dockViewMode === 'all',
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
  const dockHistoryNotifications = dockHistoryData?.data ?? [];
  const dockHistoryTotalPages = Math.ceil((dockHistoryData?.overallCount ?? 0) / HISTORY_PAGE_SIZE);

  const { removingIds, markingAll, expandedIds, expandedGroups, toggleExpand, toggleGroup, markRead, markAllRead, handleNavigate } = useNotificationActions(queryClient, notifications, router);

  const handleDockHistoryMarkRead = useCallback((id: string) => markReadAndInvalidate(queryClient, id), [queryClient]);
  const handleDockHistoryNavigate = useCallback((n: NotificationRecord) => navigateToNotification(n, handleDockHistoryMarkRead, router), [handleDockHistoryMarkRead, router]);

  if (!open || notifMode !== 'dock') return null;

  return (
    <aside
      className="hidden lg:flex flex-col flex-shrink-0 bg-surface border-l border-border-light h-screen sticky top-0 overflow-hidden transition-[width] duration-200"
      style={{ width: PANEL_WIDTH }}
    >
      {/* Header */}
      <div className="flex flex-col border-b border-border-light flex-shrink-0">
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-sm font-medium text-text-main">Уведомления</span>
          <div className="flex items-center gap-2">
            {dockViewMode === 'unread' && unreadCount > 0 && (
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
              onClick={() => { setNotifOpen(false); setDockViewMode('unread'); setDockHistoryPage(1); setDockHistoryGroup(''); }}
              className="text-text-sub hover:text-text-main cursor-pointer p-1"
              aria-label="Закрыть"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        <NotificationViewTabs
          viewMode={dockViewMode}
          unreadCount={unreadCount}
          onSelectUnread={() => setDockViewMode('unread')}
          onSelectAll={() => { setDockViewMode('all'); setDockHistoryPage(1); }}
        />
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {dockViewMode === 'unread' ? (
          <NotificationList
            notifications={notifications}
            removingIds={removingIds}
            markingAll={markingAll}
            expandedIds={expandedIds}
            expandedGroups={expandedGroups}
            onToggleExpand={toggleExpand}
            onToggleGroup={toggleGroup}
            onMarkRead={markRead}
            onNavigate={handleNavigate}
          />
        ) : (
          <HistoryList
            notifications={dockHistoryNotifications}
            page={dockHistoryPage}
            totalPages={dockHistoryTotalPages}
            group={dockHistoryGroup}
            onPageChange={setDockHistoryPage}
            onGroupChange={setDockHistoryGroup}
            onMarkRead={handleDockHistoryMarkRead}
            onNavigate={handleDockHistoryNavigate}
          />
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-3 py-2 border-t border-border-light flex-shrink-0 bg-surface-secondary">
        <span className="text-[11px] text-text-sub">
          {unreadCount > 0 ? `${unreadCount} непрочитанных` : 'Нет новых'}
        </span>
        <div className="flex items-center gap-1">
          {dockViewMode === 'unread' && unreadCount > 0 && (
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

// ─── Notification List (grouped) ────────────────────────────────

interface NotifGroupView {
  key: string;
  label: string;
  items: NotificationRecord[];
}

function buildGroups(notifications: NotificationRecord[]): NotifGroupView[] {
  const map = new Map<string, NotificationRecord[]>();
  const order: string[] = [];
  for (const n of notifications) {
    const key = getNotificationGroup(n.type);
    if (!map.has(key)) { map.set(key, []); order.push(key); }
    map.get(key)!.push(n);
  }
  return order.map(key => ({
    key,
    label: GROUP_LABELS[key] ?? key,
    items: map.get(key)!,
  }));
}

function NotificationList({
  notifications,
  removingIds,
  markingAll,
  expandedIds,
  expandedGroups,
  onToggleExpand,
  onToggleGroup,
  onMarkRead,
  onNavigate,
}: {
  notifications: NotificationRecord[];
  removingIds: Set<string>;
  markingAll: boolean;
  expandedIds: Set<string>;
  expandedGroups: Set<string>;
  onToggleExpand: (id: string) => void;
  onToggleGroup: (group: string) => void;
  onMarkRead: (id: string) => void;
  onNavigate: (n: NotificationRecord) => void;
}) {
  const groups = useMemo(() => buildGroups(notifications), [notifications]);

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 px-6 animate-[empty-state-in_400ms_ease-out]">
        <BellOff className="w-10 h-10 text-text-sub/30" />
        <p className="text-sm text-text-sub text-center">Нет новых уведомлений</p>
      </div>
    );
  }

  return (
    <>
      {groups.map(group => {
        const isGroupOpen = expandedGroups.has(group.key);
        const latestTime = group.items[0]?.createdAt;
        return (
          <div key={group.key} className="border-b border-border-light/50 last:border-b-0">
            {/* Group header */}
            <button
              type="button"
              onClick={() => onToggleGroup(group.key)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-hover transition-colors cursor-pointer"
            >
              <div className="flex-shrink-0">
                <NotificationIcon type={group.items[0].type} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-medium text-text-main">{group.label}</span>
                  <span className="text-[11px] text-text-sub bg-surface-secondary px-1.5 py-0.5 min-w-[20px] text-center">
                    {group.items.length}
                  </span>
                </div>
                {!isGroupOpen && latestTime && (
                  <span className="text-[11px] text-text-sub/50 mt-0.5 block">
                    {formatTimeAgo(new Date(latestTime).getTime())}
                  </span>
                )}
              </div>
              <ChevronDown
                className={`w-3.5 h-3.5 text-text-sub/40 flex-shrink-0 transition-transform duration-200 ${isGroupOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {/* Group items */}
            {isGroupOpen && (
              <div className="border-t border-border-light/30 animate-[group-expand_250ms_ease-out] overflow-hidden">
                {group.items.map((n, i) => (
                  <NotificationItem
                    key={n.id}
                    notification={n}
                    index={i}
                    isRemoving={removingIds.has(n.id)}
                    markingAll={markingAll}
                    isExpanded={expandedIds.has(n.id)}
                    onToggleExpand={onToggleExpand}
                    onMarkRead={onMarkRead}
                    onNavigate={onNavigate}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}

// ─── Individual Notification Item ────────────────────────────────

function NotificationItem({
  notification: n,
  index: i,
  isRemoving,
  markingAll,
  isExpanded,
  onToggleExpand,
  onMarkRead,
  onNavigate,
}: {
  notification: NotificationRecord;
  index: number;
  isRemoving: boolean;
  markingAll: boolean;
  isExpanded: boolean;
  onToggleExpand: (id: string) => void;
  onMarkRead: (id: string) => void;
  onNavigate: (n: NotificationRecord) => void;
}) {
  const navigable = isNotificationNavigable(n);
  const urgency = n.urgency ?? 'normal';
  const urgencyBorder = URGENCY_BORDER[urgency] ?? URGENCY_BORDER_DEFAULT;
  const urgencyLabel = URGENCY_LABEL[urgency];

  return (
    <div
      className={`border-b border-border-light/30 last:border-b-0 ${urgencyBorder} ${isRemoving
        ? 'animate-[notification-remove_400ms_ease-in-out_forwards] pointer-events-none'
        : 'animate-[notification-item_300ms_ease-out_both]'
      }`}
      style={{ animationDelay: `${isRemoving && markingAll ? i * 50 : isRemoving ? 0 : i * 50}ms` }}
    >
      <button
        type="button"
        onClick={() => onToggleExpand(n.id)}
        className="w-full flex items-start gap-3 text-left cursor-pointer pl-11 pr-4 py-2.5 hover:bg-surface-hover transition-colors"
      >
        {/* Unread dot */}
        <span className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 -ml-5 ${urgency === 'critical' ? 'bg-error animate-[unread-pulse_1s_ease-in-out_infinite]' : 'bg-brand-red animate-[unread-pulse_2s_ease-in-out_infinite]'}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-[13px] font-medium text-text-main leading-tight">
              {n.title}
            </p>
            {urgencyLabel && (
              <span className={`text-[10px] px-1.5 py-0.5 font-medium flex-shrink-0 ${urgency === 'critical' ? 'bg-error/10 text-error' : 'bg-warning/10 text-warning'}`}>
                {urgencyLabel}
              </span>
            )}
          </div>
          {n.body && (
            <p className={`text-[12px] text-text-sub mt-1 leading-relaxed ${isExpanded ? '' : 'line-clamp-2'}`}>
              {n.body}
            </p>
          )}
          <span className="text-[11px] text-text-sub/50 mt-1 block">
            {formatTimeAgo(new Date(n.createdAt).getTime())}
          </span>
        </div>
        {n.body && n.body.length > 60 && (
          <ChevronDown
            className={`w-3.5 h-3.5 text-text-sub/40 flex-shrink-0 mt-1 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
            onClick={(e) => { e.stopPropagation(); onToggleExpand(n.id); }}
          />
        )}
      </button>
      <div className="flex items-center justify-end gap-4 pl-11 pr-4 pb-2 -mt-1">
        {navigable && (
          <button
            type="button"
            onClick={() => onNavigate(n)}
            className="text-[11px] text-text-sub hover:text-brand-red transition-colors cursor-pointer"
          >
            Перейти
          </button>
        )}
        <button
          type="button"
          onClick={() => onMarkRead(n.id)}
          className="text-[11px] text-text-sub hover:text-brand-red transition-colors cursor-pointer"
        >
          Прочитано
        </button>
      </div>
    </div>
  );
}

// ─── History List (all notifications with pagination) ──────────

function HistoryList({
  notifications,
  page,
  totalPages,
  group,
  onPageChange,
  onGroupChange,
  onMarkRead,
  onNavigate,
}: {
  notifications: NotificationRecord[];
  page: number;
  totalPages: number;
  group: string;
  onPageChange: (page: number) => void;
  onGroupChange: (group: string) => void;
  onMarkRead: (id: string) => void;
  onNavigate: (n: NotificationRecord) => void;
}) {
  const [expandedIds, toggleExpand, clearExpanded] = useToggleSet();

  useEffect(() => { clearExpanded(); }, [page, group, clearExpanded]);

  return (
    <div className="flex flex-col">
      {/* Group filter */}
      <div className="px-4 py-2 border-b border-border-light/50">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
          {GROUP_OPTIONS.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onGroupChange(opt.value); onPageChange(1); }}
              className={`text-[11px] px-2 py-1 whitespace-nowrap transition-colors cursor-pointer ${
                group === opt.value
                  ? 'bg-brand-red text-text-on-brand font-medium'
                  : 'bg-surface-secondary text-text-sub hover:text-text-main'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Notification items */}
      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 px-6">
          <BellOff className="w-10 h-10 text-text-sub/30" />
          <p className="text-sm text-text-sub text-center">Нет уведомлений</p>
        </div>
      ) : (
        <>
          {notifications.map(n => (
            <HistoryItem
              key={n.id}
              notification={n}
              isExpanded={expandedIds.has(n.id)}
              onToggleExpand={toggleExpand}
              onMarkRead={onMarkRead}
              onNavigate={onNavigate}
            />
          ))}
        </>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 px-4 py-3 border-t border-border-light">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="text-[12px] text-text-sub hover:text-text-main disabled:opacity-30 cursor-pointer disabled:cursor-default"
          >
            Назад
          </button>
          <span className="text-[11px] text-text-sub">{page} / {totalPages}</span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            className="text-[12px] text-text-sub hover:text-text-main disabled:opacity-30 cursor-pointer disabled:cursor-default"
          >
            Далее
          </button>
        </div>
      )}
    </div>
  );
}

function HistoryItem({
  notification: n,
  isExpanded,
  onToggleExpand,
  onMarkRead,
  onNavigate,
}: {
  notification: NotificationRecord;
  isExpanded: boolean;
  onToggleExpand: (id: string) => void;
  onMarkRead: (id: string) => void;
  onNavigate: (n: NotificationRecord) => void;
}) {
  const urgency = n.urgency ?? 'normal';
  const urgencyBorder = URGENCY_BORDER[urgency] ?? URGENCY_BORDER_DEFAULT;
  const urgencyLabel = URGENCY_LABEL[urgency];
  const navigable = isNotificationNavigable(n);

  return (
    <div className={`border-b border-border-light/30 last:border-b-0 ${urgencyBorder} ${n.isRead ? 'opacity-50' : ''}`}>
      <button
        type="button"
        onClick={() => onToggleExpand(n.id)}
        className="w-full flex items-start gap-3 text-left cursor-pointer px-4 py-2.5 hover:bg-surface-hover transition-colors"
      >
        {/* Read/unread dot */}
        <span className="flex-shrink-0 mt-1.5 w-2">
          {!n.isRead && (
            <span className={`block w-2 h-2 rounded-full ${urgency === 'critical' ? 'bg-error' : 'bg-brand-red'}`} />
          )}
        </span>

        {/* Icon */}
        <span className="flex-shrink-0 mt-0.5">
          <NotificationIcon type={n.type} />
        </span>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-[13px] font-medium text-text-main leading-tight">{n.title}</p>
            {urgencyLabel && (
              <span className={`text-[10px] px-1.5 py-0.5 font-medium flex-shrink-0 ${urgency === 'critical' ? 'bg-error/10 text-error' : 'bg-warning/10 text-warning'}`}>
                {urgencyLabel}
              </span>
            )}
          </div>
          {n.body && (
            <p className={`text-[12px] text-text-sub mt-1 leading-relaxed ${isExpanded ? '' : 'line-clamp-2'}`}>
              {n.body}
            </p>
          )}
          <span className="text-[11px] text-text-sub/50 mt-1 block">
            {formatTimeAgo(new Date(n.createdAt).getTime())}
          </span>
        </div>

        {n.body && n.body.length > 60 && (
          <ChevronDown
            className={`w-3.5 h-3.5 text-text-sub/40 flex-shrink-0 mt-1.5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
          />
        )}
      </button>

      {/* Actions */}
      <div className="flex items-center justify-end gap-4 px-4 pb-2 -mt-1">
        {navigable && (
          <button
            type="button"
            onClick={() => onNavigate(n)}
            className="text-[11px] text-text-sub hover:text-brand-red transition-colors cursor-pointer"
          >
            Перейти
          </button>
        )}
        {!n.isRead && (
          <button
            type="button"
            onClick={() => onMarkRead(n.id)}
            className="text-[11px] text-text-sub hover:text-brand-red transition-colors cursor-pointer"
          >
            Прочитано
          </button>
        )}
      </div>
    </div>
  );
}
