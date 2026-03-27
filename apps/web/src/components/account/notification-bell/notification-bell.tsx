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
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch unread count - once on mount, then WebSocket-driven
  const { data: countData } = useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: async () => {
      const { data } = await notificationApi.unreadCount();
      return data;
    },
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

  // Fetch unread list - once on first open, then WebSocket-driven
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
      // If user is currently viewing this chat conversation, auto-dismiss
      if (
        CHAT_NOTIFICATION_TYPES.has(notification.type) &&
        notification.targetId === getActiveConversation()
      ) {
        notificationApi.markAsRead(notification.id);
        return;
      }

      // Increment badge count
      queryClient.setQueryData<{ count: number }>(['notifications-unread-count'], (old) => ({
        count: (old?.count ?? 0) + 1,
      }));
      // Prepend to list cache (seed if first notification)
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
    // Optimistic: decrement count, remove from list
    queryClient.setQueryData<{ count: number }>(['notifications-unread-count'], (old) => ({
      count: Math.max(0, (old?.count ?? 1) - 1),
    }));
    queryClient.setQueryData<ListCache>(['notifications-unread-list'], (old) => {
      if (!old) return old;
      const filtered = old.data.filter((n) => n.id !== id);
      return { ...old, data: filtered, overallCount: Math.max(0, old.overallCount - 1) };
    });
    // Fire API (no refetch on success - cache is already correct)
    notificationApi.markAsRead(id).finally(() => {
      setMarkingIds((prev) => { const next = new Set(prev); next.delete(id); return next; });
    });
  }, [queryClient]);

  // ── Optimistic mark all as read ──────────────────────────────
  const [markingAll, setMarkingAll] = useState(false);

  const markAllRead = useCallback(() => {
    setMarkingAll(true);
    // Optimistic: zero everything
    queryClient.setQueryData(['notifications-unread-count'], { count: 0 });
    queryClient.setQueryData<ListCache>(['notifications-unread-list'], (old) => {
      if (!old) return old;
      return { ...old, data: [], overallCount: 0 };
    });
    notificationApi.markAllAsRead().finally(() => setMarkingAll(false));
  }, [queryClient]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  function handleNotificationClick(n: NotificationRecord) {
    const config = NOTIFICATION_TYPE_CONFIG[n.type];
    const href = config?.href?.(n);

    markRead(n.id);
    setOpen(false);

    if (href) {
      router.push(href);
    }
  }

  function isClickable(n: NotificationRecord): boolean {
    const config = NOTIFICATION_TYPE_CONFIG[n.type];
    return !!config?.href;
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-label="Уведомления"
        className="relative cursor-pointer"
      >
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        </svg>

        {/* Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -left-1.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-brand-red text-white text-[10px] font-medium px-1 leading-none">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 max-h-[420px] bg-white rounded-sm shadow-lg border border-border-light z-50 flex flex-col">
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
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-text-sub">
                Нет новых уведомлений
              </div>
            ) : (
              notifications.map((n) => {
                const clickable = isClickable(n);
                return (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => handleNotificationClick(n)}
                    className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors border-b border-border-light/50 last:border-b-0 ${
                      clickable
                        ? 'hover:bg-gray-50 cursor-pointer'
                        : 'cursor-default'
                    }`}
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
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
