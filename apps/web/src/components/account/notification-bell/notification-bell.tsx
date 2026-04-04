'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, X, ChevronRight } from 'lucide-react';
import { notificationApi } from '@/lib/api/notification';
import { useNotificationSocket } from '@/lib/hooks/use-notification-socket';
import { getActiveConversation } from '@/lib/active-conversation';
import type { NotificationRecord } from '@/lib/api/types';
import type { ListCache } from './types';
import { CHAT_NOTIFICATION_TYPES, NOTIFICATION_TYPE_CONFIG, getTimeAgo } from './constants';
import { NotificationIcon } from './notification-icon';

export function NotificationBell() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const desktopPanelRef = useRef<HTMLDivElement>(null);
  const [desktopPos, setDesktopPos] = useState<{ x: number; y: number } | null>(null);

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

      queryClient.setQueryData<{ count: number }>(['notifications-unread-count'], (old) => ({
        count: (old?.count ?? 0) + 1,
      }));
      queryClient.setQueryData<ListCache>(
        ['notifications-unread-list'],
        (old) => {
          if (!old) return { data: [notification], overallCount: 1 };
          return { ...old, data: [notification, ...old.data], overallCount: old.overallCount + 1 };
        },
      );
    }, [queryClient]),
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

  // ── Open / Close ─────────────────────────────────────────────
  const handleClose = useCallback(() => {
    setClosing(true);
    setTimeout(() => { setOpen(false); setClosing(false); }, 200);
  }, []);

  const handleToggle = useCallback(() => {
    if (open) handleClose();
    else setOpen(true);
  }, [open, handleClose]);

  // ── Desktop panel positioning ────────────────────────────────
  useEffect(() => {
    if (!open || !triggerRef.current) { setDesktopPos(null); return; }
    const rect = triggerRef.current.getBoundingClientRect();
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

  // ── Notification click handler ───────────────────────────────
  function handleNotificationClick(n: NotificationRecord) {
    const config = NOTIFICATION_TYPE_CONFIG[n.type];
    const href = config?.href?.(n);
    markRead(n.id);
    handleClose();
    if (href) router.push(href);
  }

  function isClickable(n: NotificationRecord): boolean {
    const config = NOTIFICATION_TYPE_CONFIG[n.type];
    return !!config?.href;
  }

  // ── Animations ───────────────────────────────────────────────
  const panelAnimation = closing
    ? 'animate-[notification-out_200ms_ease-in_forwards]'
    : 'animate-[notification-in_250ms_ease-out]';

  const overlayAnimation = closing
    ? 'animate-[fade-out_200ms_ease-in_forwards]'
    : 'animate-[fade-in_200ms_ease-out]';

  // ── Shared panel header ──────────────────────────────────────
  const panelHeader = (
    <div className="flex items-center justify-between px-4 py-3 border-b border-border-light flex-shrink-0">
      <span className="text-sm font-medium text-text-main">Уведомления</span>
      <div className="flex items-center gap-3">
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
      onNotificationClick={handleNotificationClick}
      isClickable={isClickable}
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
          className={`w-6 h-6 text-amber-400 transition-transform duration-200 ${open ? 'scale-110' : 'group-hover:scale-110'}`}
          strokeWidth={1.5}
        />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -left-1.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-brand-red text-white text-[10px] font-medium px-1 leading-none animate-[badge-pop_300ms_ease-out]">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Mobile: full-screen bottom sheet */}
      {open && (
        <div className="lg:hidden">
          <div
            className={`fixed inset-0 z-[9999] bg-black/40 ${overlayAnimation}`}
            onClick={handleClose}
          />
          <div className={`fixed inset-x-0 bottom-0 z-[10000] bg-white rounded-t-2xl max-h-[85vh] flex flex-col ${panelAnimation}`}>
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
          className={`hidden lg:flex fixed z-[10000] flex-col w-80 max-h-[420px] bg-white rounded-sm shadow-lg border border-border-light overflow-hidden ${panelAnimation}`}
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
  onNotificationClick,
  isClickable,
}: {
  notifications: NotificationRecord[];
  removingIds: Set<string>;
  onNotificationClick: (n: NotificationRecord) => void;
  isClickable: (n: NotificationRecord) => boolean;
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
        const clickable = isClickable(n);
        const isRemoving = removingIds.has(n.id);
        return (
          <button
            key={n.id}
            type="button"
            onClick={() => onNotificationClick(n)}
            className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors border-b border-border-light/50 last:border-b-0 ${
              isRemoving
                ? 'animate-[notification-remove_400ms_ease-in-out_forwards] pointer-events-none'
                : 'animate-[notification-item_300ms_ease-out_both]'
            } ${
              clickable && !isRemoving ? 'hover:bg-gray-50 active:bg-gray-100 cursor-pointer' : 'cursor-default'
            }`}
            style={isRemoving ? undefined : { animationDelay: `${i * 50}ms` }}
          >
            <div className="flex-shrink-0 mt-0.5">
              <NotificationIcon type={n.type} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-main leading-tight truncate">
                {n.title}
              </p>
              <p className="text-xs text-text-sub mt-0.5 line-clamp-2">
                {n.body}
              </p>
              <p className="text-[10px] text-text-sub/60 mt-1">
                {getTimeAgo(n.createdAt)}
              </p>
            </div>
            {clickable && (
              <ChevronRight className="w-4 h-4 text-text-sub/40 flex-shrink-0 mt-1" />
            )}
          </button>
        );
      })}
    </>
  );
}
