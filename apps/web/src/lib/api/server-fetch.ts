import 'server-only';

/**
 * Server-side fetch helper for public API endpoints.
 * Used by server components only — importing in a client component will cause a build error.
 * For client-side API calls, use the axios `api` client from `./client.ts`.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function serverGet<T>(path: string): Promise<T | null> {
    try {
        const res = await fetch(`${API_URL}${path}`, {
            cache: 'no-store',
        });
        if (!res.ok) return null;
        return res.json();
    } catch {
        return null;
    }
}
