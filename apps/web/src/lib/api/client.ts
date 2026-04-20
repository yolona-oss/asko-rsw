import axios from 'axios';
import type { AccessToken } from './types';
import { store } from '@/store';
import { setAccessToken, logout } from '@/store/auth';
import { errorStore, extractErrorMessage } from '../error-store';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // send refresh token cookie
});

// Attach access token + Accept-Language from localStorage to every request
api.interceptors.request.use((config) => {
  const token = store.getState().auth.accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const lang = typeof window !== 'undefined'
    ? localStorage.getItem('language') || 'ru'
    : 'ru';
  config.headers['Accept-Language'] = lang;
  return config;
});

// Auto-refresh on 401
let refreshPromise: Promise<string | null> | null = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    // Skip refresh for auth endpoints that don't use access tokens
    if (original?.url === '/auth/refresh') {
      store.dispatch(logout());
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;

      // Deduplicate concurrent refresh calls
      if (!refreshPromise) {
        refreshPromise = refreshAccessToken();
      }

      try {
        const newToken = await refreshPromise;
        if (newToken) {
          original.headers.Authorization = `Bearer ${newToken}`;
          return api(original);
        }
      } catch {
        // refresh failed - logout
      } finally {
        refreshPromise = null;
      }

      store.dispatch(logout());
    }

    // Global error modal - skip auth endpoints, 401s, and silent requests
    if (
      error.response?.status !== 401 &&
      !original?.url?.startsWith('/auth/') &&
      !(original as any)?._silent
    ) {
      errorStore.show(extractErrorMessage(error));
    }

    return Promise.reject(error);
  },
);

async function refreshAccessToken(): Promise<string | null> {
  try {
    const { data } = await api.post<AccessToken>('/auth/refresh');
    store.dispatch(setAccessToken(data.access_token));
    return data.access_token;
  } catch {
    store.dispatch(logout());
    return null;
  }
}

// Cross-tab logout sync via localStorage event
import { storage, STORAGE_KEYS } from '@/lib/storage';

export function broadcastLogout() {
  storage.set(STORAGE_KEYS.logout, Date.now().toString());
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEYS.logout && e.newValue) {
      store.dispatch(logout());
    }
  });
}
