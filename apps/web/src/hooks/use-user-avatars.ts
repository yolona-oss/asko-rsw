'use client';

import { useState, useEffect, useRef } from 'react';
import { usersApi } from '@/lib/api/users';

/**
 * Caches avatar URLs for a set of user IDs.
 * Fetches on mount and when new userIds are added.
 */
export function useUserAvatars(userIds: string[]): Record<string, string | null> {
  const [avatars, setAvatars] = useState<Record<string, string | null>>({});
  const fetchedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const toFetch = userIds.filter((id) => id && !fetchedRef.current.has(id));
    if (toFetch.length === 0) return;

    toFetch.forEach((id) => fetchedRef.current.add(id));

    Promise.all(
      toFetch.map(async (id) => {
        const url = await usersApi.getAvatarUrl(id);
        return { id, url };
      }),
    ).then((results) => {
      setAvatars((prev) => {
        const next = { ...prev };
        for (const { id, url } of results) {
          next[id] = url;
        }
        return next;
      });
    });
  }, [userIds.join(',')]);

  return avatars;
}
