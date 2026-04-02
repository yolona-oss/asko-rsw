'use client';

import { useContext } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store';
import { setCredentials, logout as logoutAction } from '@/store/auth-slice';
import { AuthReadyContext } from '@/store/providers';
import { authApi } from './auth';
import type { LoginCredentials, CreateUserDto } from '@asko/shared/client';
import type { IAuthSession } from './types';

export function useAuth() {
  const { accessToken, user } = useAppSelector((s) => s.auth);
  const authReady = useContext(AuthReadyContext);
  return { isAuthenticated: !!accessToken, accessToken, user, authReady };
}

export function useSession() {
  const authReady = useContext(AuthReadyContext);
  return useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const { data } = await authApi.getSession();
      return data;
    },
    enabled: authReady,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}

export function useLogin() {
  const dispatch = useAppDispatch();
  const router = useRouter();

  return useMutation({
    mutationFn: (credentials: LoginCredentials) =>
      authApi.login(credentials).then((r) => r.data),
    onSuccess: (data: any) => {
      if (data.status === 'MFA_REQUIRED') {
        // Don't dispatch credentials — component reads mutation.data for MFA state
        return;
      }
      dispatch(setCredentials({ accessToken: data.access_token, user: data.user }));
      router.push('/account');
    },
  });
}

export function useVerifyMfaOtp() {
  const dispatch = useAppDispatch();
  const router = useRouter();

  return useMutation({
    mutationFn: (data: { mfaToken: string; code: string; trustDevice?: boolean }) =>
      authApi.verifyMfaOtp(data).then((r) => r.data),
    onSuccess: (data) => {
      dispatch(setCredentials({ accessToken: data.access_token, user: data.user }));
      router.push('/account');
    },
  });
}

export function useSignup(options?: { onSuccess?: (data: any) => void }) {
  const dispatch = useAppDispatch();
  const router = useRouter();

  return useMutation({
    mutationFn: (data: CreateUserDto) => authApi.signup(data).then((r) => r.data),
    onSuccess: (data: any) => {
      if (data.status === 'OTP_REQUIRED') {
        options?.onSuccess?.(data);
        return;
      }
      dispatch(setCredentials({ accessToken: data.access_token, user: data.user }));
      if (options?.onSuccess) {
        options.onSuccess(data);
      } else {
        router.push('/account');
      }
    },
  });
}

export function useVerifyPhoneRegister() {
  const dispatch = useAppDispatch();
  const router = useRouter();

  return useMutation({
    mutationFn: (data: { pendingToken: string; code: string }) =>
      authApi.verifyPhoneRegister(data).then((r) => r.data),
    onSuccess: (data) => {
      dispatch(setCredentials({ accessToken: data.access_token, user: data.user }));
      router.push('/account');
    },
  });
}

export function useLogout() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authApi.logout(),
    onSettled: () => {
      dispatch(logoutAction());
      queryClient.clear();
      router.push('/login');
    },
  });
}
