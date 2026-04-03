'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: countData } = useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: async () => {
      const { data } = await notificationApi.unreadCount();
      return data;
    },
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

  const { data: listData } = useQuery({
    queryKey: ['notifications-unread-list'],
    queryFn: async () => {
      const { data } = await notificationApi.list({ limit: 20, unreadOnly: true });
      return data;
    },
    enabled: open,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
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

  // ── Optimistic mark single as read ───────────────────────────
  const [markingIds, setMarkingIds] = useState<Set<string>>(new Set());

  const markRead = useCallback((id: string) => {
    setMarkingIds((prev) => new Set(prev).add(id));
    queryClient.setQueryData<{ count: number }>(['notifications-unread-count'], (old) => ({
      count: Math.max(0, (old?.count ?? 1) - 1),
    }));
    queryClient.setQueryData<ListCache>(['notifications-unread-list'], (old) => {
      if (!old) return old;
      const filtered = old.data.filter((n) => n.id !== id);
      return { ...old, data: filtered, overallCount: Math.max(0, old.overallCount - 1) };
    });
    notificationApi.markAsRead(id).finally(() => {
      setMarkingIds((prev) => { const next = new Set(prev); next.delete(id); return next; });
    });
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

  // ── Open/Close with animation ────────────────────────────────
  const handleClose = useCallback(() => {
    setClosing(true);
    setTimeout(() => {
      setOpen(false);
      setClosing(false);
    }, 200);
  }, []);

  const handleToggle = useCallback(() => {
    if (open) handleClose();
    else setOpen(true);
  }, [open, handleClose]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        handleClose();
      }
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open, handleClose]);

  // Lock body scroll on mobile when open
  useEffect(() => {
    if (!open) return;
    const mq = window.matchMedia('(max-width: 1023px)');
    if (mq.matches) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [open]);

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

  const panelAnimation = closing
    ? 'animate-[notification-out_200ms_ease-in_forwards]'
    : 'animate-[notification-in_250ms_ease-out]';

  const overlayAnimation = closing
    ? 'animate-[fade-out_200ms_ease-in_forwards]'
    : 'animate-[fade-in_200ms_ease-out]';

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <button
        type="button"
        onClick={handleToggle}
        aria-label="Уведомления"
        className="relative cursor-pointer group"
      >
        <svg
          className={`w-6 h-6 transition-transform duration-200 ${open ? 'scale-110' : 'group-hover:scale-110'}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="#F59E0B"
          strokeWidth={1.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        </svg>

        {/* Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -left-1.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-brand-red text-white text-[10px] font-medium px-1 leading-none animate-[badge-pop_300ms_ease-out]">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Mobile: full-screen overlay + slide-up panel */}
      {open && (
        <div className="lg:hidden">
          {/* Backdrop */}
          <div
            className={`fixed inset-0 z-40 bg-black/40 ${overlayAnimation}`}
            onClick={handleClose}
          />
          {/* Panel */}
          <div className={`fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-2xl max-h-[85vh] flex flex-col ${panelAnimation}`}>
            {/* Drag handle */}
            <div className="flex justify-center py-3">
              <div className="w-10 h-1 rounded-full bg-border-light" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 pb-3 border-b border-border-light">
              <span className="text-base font-medium text-text-main">Уведомления</span>
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
                  className="text-text-sub hover:text-text-main"
                  aria-label="Закрыть"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto overscroll-contain">
              <NotificationList
                notifications={notifications}
                onNotificationClick={handleNotificationClick}
                isClickable={isClickable}
              />
            </div>
          </div>
        </div>
      )}

      {/* Desktop: dropdown */}
      {open && (
        <div className={`hidden lg:flex absolute right-0 top-full mt-2 w-80 max-h-[420px] bg-white rounded-sm shadow-lg border border-border-light z-50 flex-col ${panelAnimation}`}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border-light">
            <span className="text-sm font-medium text-text-main">Уведомления</span>
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
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            <NotificationList
              notifications={notifications}
              onNotificationClick={handleNotificationClick}
              isClickable={isClickable}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Notification List (shared between mobile & desktop) ───────

function NotificationList({
  notifications,
  onNotificationClick,
  isClickable,
}: {
  notifications: NotificationRecord[];
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
        return (
          <button
            key={n.id}
            type="button"
            onClick={() => onNotificationClick(n)}
            className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors border-b border-border-light/50 last:border-b-0 animate-[notification-item_300ms_ease-out_both] ${
              clickable ? 'hover:bg-gray-50 active:bg-gray-100 cursor-pointer' : 'cursor-default'
            }`}
            style={{ animationDelay: `${i * 50}ms` }}
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
              <svg className="w-4 h-4 text-text-sub/40 flex-shrink-0 mt-1" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            )}
          </button>
        );
      })}
    </>
  );
}
