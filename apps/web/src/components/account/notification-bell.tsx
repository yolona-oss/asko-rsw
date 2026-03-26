'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { notificationApi } from '@/lib/api/notification';
import { useNotificationSocket } from '@/lib/hooks/use-notification-socket';
import type { NotificationRecord } from '@/lib/api/types';

const NOTIFICATION_TYPE_CONFIG: Record<string, {
  icon: string;
  href?: (n: NotificationRecord) => string;
}> = {
  repair_status_changed: {
    icon: 'repair',
    href: (n) => n.targetId ? `/account/requests/${n.targetId}` : undefined as any,
  },
  repair_assigned: {
    icon: 'repair',
    href: (n) => n.targetId ? `/account/requests/${n.targetId}` : undefined as any,
  },
  repair_completed: {
    icon: 'repair',
    href: (n) => n.targetId ? `/account/requests/${n.targetId}` : undefined as any,
  },
  payment_paid: {
    icon: 'payment',
    href: () => '/account/payments',
  },
  payment_failed: {
    icon: 'payment',
    href: () => '/account/payments',
  },
  payment_refunded: {
    icon: 'payment',
    href: () => '/account/payments',
  },
  certificate_issued: {
    icon: 'certificate',
    href: () => '/account/certificates',
  },
  chat_message: {
    icon: 'chat',
    href: (n) => n.targetId ? `/account/chat?conversation=${n.targetId}` : undefined as any,
  },
  chat_conversation_created: {
    icon: 'chat',
    href: (n) => n.targetId ? `/account/chat?conversation=${n.targetId}` : undefined as any,
  },
  chat_participant_added: {
    icon: 'chat',
    href: (n) => n.targetId ? `/account/chat?conversation=${n.targetId}` : undefined as any,
  },
  chat_participant_removed: {
    icon: 'chat',
  },
  message: { icon: 'message' },
  system: { icon: 'system' },
};

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'только что';
  if (minutes < 60) return `${minutes} мин. назад`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ч. назад`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} дн. назад`;
  return new Date(dateStr).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

function NotificationIcon({ type }: { type: string }) {
  const config = NOTIFICATION_TYPE_CONFIG[type];
  const icon = config?.icon ?? 'system';

  switch (icon) {
    case 'repair':
      return (
        <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17l-5.58-5.58a2.002 2.002 0 010-2.83l.36-.36a2 2 0 012.83 0l5.58 5.58m-6.16 6.16l6.16-6.16m0 0l5.58 5.58a2 2 0 010 2.83l-.36.36a2 2 0 01-2.83 0l-5.58-5.58" />
        </svg>
      );
    case 'payment':
      return (
        <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
        </svg>
      );
    case 'certificate':
      return (
        <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      );
    case 'chat':
      return (
        <svg className="w-5 h-5 text-violet-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
        </svg>
      );
    default:
      return (
        <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        </svg>
      );
  }
}

export function NotificationBell() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch unread count
  const { data: countData } = useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: async () => {
      const { data } = await notificationApi.unreadCount();
      return data;
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  // Fetch unread notifications (when dropdown open)
  const { data: listData, refetch: refetchList } = useQuery({
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

  // Real-time via WebSocket
  useNotificationSocket(
    useCallback((notification: NotificationRecord) => {
      queryClient.setQueryData<{ count: number }>(['notifications-unread-count'], (old) => ({
        count: (old?.count ?? 0) + 1,
      }));
      // Prepend to list — if cache exists update it, otherwise seed it
      queryClient.setQueryData<{ data: NotificationRecord[]; overallCount: number }>(
        ['notifications-unread-list'],
        (old) => {
          if (!old) return { data: [notification], overallCount: 1 };
          return { ...old, data: [notification, ...old.data], overallCount: old.overallCount + 1 };
        },
      );
    }, [queryClient]),
    useCallback((_delta: number) => {
      // Already handled via the 'notification' event above
    }, []),
  );

  // Mark single as read
  const markRead = useMutation({
    mutationFn: (id: string) => notificationApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-list'] });
    },
  });

  // Mark all as read
  const markAllRead = useMutation({
    mutationFn: () => notificationApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.setQueryData(['notifications-unread-count'], { count: 0 });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-list'] });
    },
  });

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

    markRead.mutate(n.id);
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
        onClick={() => { setOpen(!open); if (!open) refetchList(); }}
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
                onClick={() => markAllRead.mutate()}
                disabled={markAllRead.isPending}
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
