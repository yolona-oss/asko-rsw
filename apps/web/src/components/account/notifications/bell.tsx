'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, X, ChevronDown, Volume2, VolumeX } from 'lucide-react';
import { notificationApi } from '@/lib/api/notification';
import { useNotificationSocket } from '@/lib/hooks/use-notification-socket';
import { useSoundMute } from '@/lib/hooks/use-sound-mute';
import { playSound, isReminderEnabled } from '@/lib/sound';
import { getActiveConversation } from '@/lib/active-conversation';
import type { NotificationRecord } from '@/lib/api/types';
import type { ListCache } from './types';
import { CHAT_NOTIFICATION_TYPES, NOTIFICATION_TYPE_CONFIG, getTimeAgo } from './constants';
import { NotificationIcon } from './icon';

const REMINDER_MS = 5 * 60 * 1000;

function isNotificationNavigable(n: NotificationRecord): boolean {
  return !!NOTIFICATION_TYPE_CONFIG[n.type]?.href;
}

export function NotificationBell() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const desktopPanelRef = useRef<HTMLDivElement>(null);
  const [desktopPos, setDesktopPos] = useState<{ x: number; y: number } | null>(null);
  const [soundMuted, toggleMute] = useSoundMute('notification');

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
    if (hasUnread) scheduleReminder();
    else clearReminder();
  }, [hasUnread, scheduleReminder, clearReminder]);

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
    setMarkingAll(true);
    queryClient.setQueryData(['notifications-unread-count'], { count: 0 });
    queryClient.setQueryData<ListCache>(['notifications-unread-list'], (old) => {
      if (!old) return old;
      return { ...old, data: [], overallCount: 0 };
    });
    notificationApi.markAllAsRead().finally(() => setMarkingAll(false));
  }, [queryClient]);

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
    setClosing(true);
    setTimeout(() => { setOpen(false); setClosing(false); setExpandedIds(new Set()); }, 200);
  }, []);

  const handleToggle = useCallback(() => {
    if (open) handleClose();
    else setOpen(true);
  }, [open, handleClose]);

  // ── Navigate to notification target ──────────────────────────
  const handleNavigate = useCallback((n: NotificationRecord) => {
    const config = NOTIFICATION_TYPE_CONFIG[n.type];
    const href = config?.href?.(n);
    markRead(n.id);
    handleClose();
    if (href) router.push(href);
  }, [markRead, handleClose, router]);

  // ── Desktop panel positioning ────────────────────────────────
  useEffect(() => {
    if (!open || !triggerRef.current) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDesktopPos(null);
      return;
    }
    const rect = triggerRef.current.getBoundingClientRect();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDesktopPos({ x: rect.right - 320, y: rect.bottom + 8 });
  }, [open]);

  // ── Outside click (desktop panel + trigger) ──────────────────
  useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent) => {
      if (triggerRef.current?.contains(e.target as Node)) return;
      if (desktopPanelRef.current?.contains(e.target as Node)) return;
      handleClose();
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open, handleClose]);

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

  // ── Animations ───────────────────────────────────────────────
  const panelAnimation = closing
    ? 'animate-[notification-out_200ms_ease-in_forwards]'
    : 'animate-[notification-in_250ms_ease-out]';

  const overlayAnimation = closing
    ? 'animate-[fade-out_200ms_ease-in_forwards]'
    : 'animate-[fade-in_200ms_ease-out]';

  // ── Panel header ─────────────────────────────────────────────
  const panelHeader = (
    <div className="flex items-center justify-between px-4 py-3 border-b border-border-light flex-shrink-0">
      <span className="text-sm font-medium text-text-main">Уведомления</span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={toggleMute}
          className="text-text-sub hover:text-text-main cursor-pointer"
          aria-label={soundMuted ? 'Включить звук' : 'Выключить звук'}
        >
          {soundMuted
            ? <VolumeX className="w-4 h-4" />
            : <Volume2 className="w-4 h-4" />}
        </button>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={markAllRead}
            disabled={markingAll}
            className="text-xs text-brand-red hover:underline cursor-pointer disabled:opacity-50"
          >
            Прочитать все
          </button>
        )}
        <button
          type="button"
          onClick={handleClose}
          className="text-text-sub hover:text-text-main cursor-pointer"
          aria-label="Закрыть"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  const notificationList = (
    <NotificationList
      notifications={notifications}
      removingIds={removingIds}
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

      {/* Mobile: full-screen bottom sheet */}
      {open && (
        <div className="lg:hidden">
          <div
            className={`fixed inset-0 z-[9999] bg-dark-deep/40 ${overlayAnimation}`}
            onClick={handleClose}
          />
          <div className={`fixed inset-x-0 bottom-0 z-[10000] bg-surface max-h-[85vh] flex flex-col ${panelAnimation}`}>
            {/* Drag handle */}
            <div className="flex justify-center py-3">
              <div className="w-10 h-1 rounded-full bg-border-light" />
            </div>
            {panelHeader}
            <div className="flex-1 overflow-y-auto overscroll-contain">
              {notificationList}
            </div>
          </div>
        </div>
      )}

      {/* Desktop: portal-based floating panel */}
      {open && createPortal(
        <div
          ref={desktopPanelRef}
          className={`hidden lg:flex fixed z-[10000] flex-col w-80 max-h-[420px] bg-surface shadow-lg border border-border-light overflow-hidden ${panelAnimation}`}
          style={desktopPos ? { left: desktopPos.x, top: desktopPos.y } : { left: -9999, top: -9999 }}
        >
          {panelHeader}
          <div className="flex-1 overflow-y-auto">
            {notificationList}
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}

// ─── Notification List ───────────────────────────────────────────

function NotificationList({
  notifications,
  removingIds,
  expandedIds,
  onToggleExpand,
  onMarkRead,
  onNavigate,
}: {
  notifications: NotificationRecord[];
  removingIds: Set<string>;
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
            className={`px-4 py-3 border-b border-border-light/50 last:border-b-0 ${
              isRemoving
                ? 'animate-[notification-remove_400ms_ease-in-out_forwards] pointer-events-none'
                : 'animate-[notification-item_300ms_ease-out_both]'
            }`}
            style={isRemoving ? undefined : { animationDelay: `${i * 50}ms` }}
          >
            {/* Main area — click to expand / collapse */}
            <button
              type="button"
              onClick={() => onToggleExpand(n.id)}
              className="w-full flex items-start gap-3 text-left cursor-pointer"
            >
              <div className="flex-shrink-0 mt-0.5">
                <NotificationIcon type={n.type} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-main leading-tight">
                  {n.title}
                </p>
                <p className={`text-xs text-text-sub mt-0.5 ${isExpanded ? '' : 'line-clamp-2'}`}>
                  {n.body}
                </p>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-text-sub/40 flex-shrink-0 mt-1 transition-transform duration-200 ${
                  isExpanded ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Footer — time + action buttons */}
            <div className="flex items-center justify-between mt-1.5 pl-8">
              <span className="text-[10px] text-text-sub/60">
                {getTimeAgo(n.createdAt)}
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => onMarkRead(n.id)}
                  className="text-[11px] text-brand-red hover:underline cursor-pointer"
                >
                  Прочитано
                </button>
                {navigable && (
                  <button
                    type="button"
                    onClick={() => onNavigate(n)}
                    className="text-[11px] text-text-sub hover:text-text-main cursor-pointer"
                  >
                    Перейти &rarr;
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
}
