'use client';

import { useEffect } from 'react';
import { articleApi } from '@/lib/api/article';

// move to lib
function getSessionId(): string {
    const key = 'sid';
    let id = localStorage.getItem(key);
    if (!id) {
        id = crypto.randomUUID();
        localStorage.setItem(key, id);
    }
    return id;
}

export function ArticleViewTracker({ slug }: { slug: string }) {
    useEffect(() => {
        try {
            const sessionId = getSessionId();
            articleApi.recordView(slug, sessionId).catch(() => { });
        } catch {
            // Silently ignore — view tracking should never break UX
        }
    }, [slug]);

    return null;
}
