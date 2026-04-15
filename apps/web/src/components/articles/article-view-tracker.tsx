'use client';

import { useEffect, useRef } from 'react';
import { articleApi } from '@/lib/api/article';
import { storage, STORAGE_KEYS } from '@/lib/storage';

const MIN_READ_TIME_MS = 5000;

function getSessionId(): string {
    let id = storage.get(STORAGE_KEYS.sessionId);
    if (!id) {
        id = crypto.randomUUID();
        storage.set(STORAGE_KEYS.sessionId, id);
    }
    return id;
}

export function ArticleViewTracker({ slug }: { slug: string }) {
    const sent = useRef(false);

    useEffect(() => {
        sent.current = false;
        const startTime = Date.now();

        const sendView = () => {
            if (sent.current) return;
            const readTime = Date.now() - startTime;
            if (readTime < MIN_READ_TIME_MS) return;
            sent.current = true;

            try {
                const sessionId = getSessionId();
                articleApi.recordView(slug, sessionId, readTime).catch(() => {});
            } catch {
                // Silently ignore
            }
        };

        // Check after MIN_READ_TIME_MS
        const timer = setTimeout(sendView, MIN_READ_TIME_MS);

        // Also send on page leave if they've been here long enough
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') sendView();
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            clearTimeout(timer);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            sendView(); // send on unmount if threshold met
        };
    }, [slug]);

    return null;
}
