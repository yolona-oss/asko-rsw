'use client';

import { useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '@/store/index';
import { fetchAvatars, selectAvatarUrls } from '@/store/avatars';

/**
 * Returns cached avatar URLs for given user IDs.
 * Dispatches fetch for any IDs not yet in the store.
 */
export function useUserAvatars(userIds: string[]): Record<string, string | null> {
    const dispatch = useAppDispatch();
    const urls = useAppSelector(selectAvatarUrls);

    useEffect(() => {
        const missing = userIds.filter((id) => id && !(id in urls));
        if (missing.length > 0) dispatch(fetchAvatars(missing));
    }, [userIds.join(','), dispatch]);

    return urls;
}
