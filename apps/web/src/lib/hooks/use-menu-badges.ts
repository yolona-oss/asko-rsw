'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { notificationApi } from '@/lib/api/notification';
import { NOTIFICATION_TYPE_CONFIG } from '@/components/account/notifications/constants';

/**
 * Returns a Set of base menu hrefs (e.g. "/account/requests")
 * that have at least one unread notification pointing to them.
 */
export function useMenuBadges(): Set<string> {
  const { data } = useQuery({
    queryKey: ['notifications-unread-list'],
    queryFn: async () => {
      const { data } = await notificationApi.list({ limit: 20, unreadOnly: true });
      return data;
    },
    staleTime: 60_000,
    refetchInterval: 60_000,
  });

  return useMemo(() => {
    const hrefs = new Set<string>();
    for (const n of data?.data ?? []) {
      const config = NOTIFICATION_TYPE_CONFIG[n.type];
      const href = config?.href?.(n);
      if (href) {
        const clean = href.split('?')[0];
        const base = clean.split('/').slice(0, 3).join('/');
        hrefs.add(base);
        if (clean !== base) hrefs.add(clean);
      }
    }
    return hrefs;
  }, [data]);
}
