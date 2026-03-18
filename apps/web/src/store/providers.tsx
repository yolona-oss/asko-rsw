'use client';

import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, createContext, type ReactNode } from 'react';
import { store, useAppDispatch, useAppSelector } from './index';
import { setCredentials } from './auth-slice';
import { authApi } from '@/lib/api/auth';

/** true once the initial silent-refresh attempt has settled */
export const AuthReadyContext = createContext(false);

/**
 * Attempts a silent token refresh on mount when Redux has no access token
 * (e.g. after a full page reload). The refresh-token cookie is sent
 * automatically via `withCredentials`. If refresh succeeds the interceptor
 * stores the new access token, then we fetch the user profile.
 */
function AuthGate({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const accessToken = useAppSelector((s) => s.auth.accessToken);
  const [ready, setReady] = useState(!!accessToken);

  useEffect(() => {
    if (accessToken) {
      setReady(true);
      return;
    }

    // getSession() will 401 → interceptor calls /auth/refresh → retries
    authApi
      .getSession()
      .then(({ data: user }) => {
        const token = store.getState().auth.accessToken;
        if (token) {
          dispatch(setCredentials({ accessToken: token, user }));
          queryClient.setQueryData(['session'], user);
        }
      })
      .catch(() => {
        // no valid refresh token - user stays unauthenticated
      })
      .finally(() => setReady(true));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthReadyContext.Provider value={ready}>
      {children}
    </AuthReadyContext.Provider>
  );
}

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: false,
          },
        },
      }),
  );

  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <AuthGate>{children}</AuthGate>
      </QueryClientProvider>
    </Provider>
  );
}
