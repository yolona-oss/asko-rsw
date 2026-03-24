import createClient, { type Middleware } from 'openapi-fetch';
import type { paths } from './api.gen';
import { store } from '@/store';
import { setAccessToken, logout } from '@/store/auth-slice';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Refresh failed');
    const data = await res.json();
    store.dispatch(setAccessToken(data.access_token));
    return data.access_token;
  } catch {
    store.dispatch(logout());
    return null;
  }
}

const authMiddleware: Middleware = {
  async onRequest({ request }) {
    const token = store.getState().auth.accessToken;
    if (token) {
      request.headers.set('Authorization', `Bearer ${token}`);
    }
    return request;
  },
  async onResponse({ response, request }) {
    if (response.status !== 401) return response;

    const url = new URL(request.url);
    if (url.pathname === '/auth/refresh' || url.pathname === '/auth/dev-switch') {
      if (url.pathname === '/auth/refresh') store.dispatch(logout());
      return response;
    }

    // Deduplicate concurrent refresh calls
    if (!refreshPromise) {
      refreshPromise = refreshAccessToken();
    }

    try {
      const newToken = await refreshPromise;
      if (newToken) {
        const retryReq = new Request(request, {
          headers: new Headers(request.headers),
        });
        retryReq.headers.set('Authorization', `Bearer ${newToken}`);
        return fetch(retryReq);
      }
    } catch {
      // refresh failed
    } finally {
      refreshPromise = null;
    }

    store.dispatch(logout());
    return response;
  },
};

export const apiClient = createClient<paths>({
  baseUrl: API_URL,
  credentials: 'include',
});

apiClient.use(authMiddleware);
