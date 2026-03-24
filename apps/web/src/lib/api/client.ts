import axios from 'axios';
import type { IAccessToken } from './types';
import { store } from '@/store';
import { setAccessToken, logout } from '@/store/auth-slice';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // send refresh token cookie
});

// Attach access token from Redux to every request
api.interceptors.request.use((config) => {
  const token = store.getState().auth.accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-refresh on 401
let refreshPromise: Promise<string | null> | null = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    // Skip refresh for auth endpoints that don't use access tokens
    if (original?.url === '/auth/refresh' || original?.url === '/auth/dev-switch') {
      if (original?.url === '/auth/refresh') store.dispatch(logout());
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

    return Promise.reject(error);
  },
);

async function refreshAccessToken(): Promise<string | null> {
  try {
    const { data } = await api.post<IAccessToken>('/auth/refresh');
    store.dispatch(setAccessToken(data.access_token));
    return data.access_token;
  } catch {
    store.dispatch(logout());
    return null;
  }
}
