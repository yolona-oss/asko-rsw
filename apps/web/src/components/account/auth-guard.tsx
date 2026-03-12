'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/api/use-auth';
import { authApi } from '@/lib/api/auth';
import { useAppDispatch } from '@/store';
import { setAccessToken, logout } from '@/store/auth-slice';

/**
 * Client-side auth guard for /account routes.
 * On mount, if no access token exists in Redux, attempts a silent refresh
 * using the httpOnly refresh token cookie.
 */
export function AuthGuard({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [checking, setChecking] = useState(!isAuthenticated);

  useEffect(() => {
    if (isAuthenticated) {
      setChecking(false);
      return;
    }

    // Try silent refresh
    authApi
      .refresh()
      .then(({ data }) => {
        dispatch(setAccessToken(data.access_token));
        setChecking(false);
      })
      .catch(() => {
        dispatch(logout());
        router.replace('/login');
      });
  }, [isAuthenticated, dispatch, router]);

  if (checking) {
    return null; // or a loading skeleton — layout already shows skeleton via AccountProvider
  }

  return <>{children}</>;
}
