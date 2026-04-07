'use client';

import { Suspense, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAppDispatch } from '@/store';
import { setCredentials } from '@/store/auth-slice';
import { authApi } from '@/lib/api/auth';

function CallbackHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const dispatch = useAppDispatch();

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');
    const linked = searchParams.get('linked');

    if (linked) {
      router.replace(`/account/profile?linked=${linked}`);
      return;
    }

    if (error) {
      router.replace(`/auth?error=${encodeURIComponent(error)}`);
      return;
    }

    if (!token) {
      router.replace('/auth?error=no_token');
      return;
    }

    dispatch(setCredentials({ accessToken: token, user: null as any }));
    authApi.getSession().then(({ data }) => {
      try { localStorage.setItem('has_account', '1'); } catch {}
      dispatch(setCredentials({ accessToken: token, user: data }));
      router.replace('/account');
    }).catch(() => {
      router.replace('/auth?error=session_failed');
    });
  }, [searchParams, router, dispatch]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-sm text-text-sub">Авторизация...</p>
    </div>
  );
}

export default function OAuthCallbackPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><p className="text-sm text-text-sub">Загрузка...</p></div>}>
      <CallbackHandler />
    </Suspense>
  );
}
