'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useLogin, useVerifyMfaOtp } from '@/lib/api/use-auth';
import { authApi } from '@/lib/api/auth';
import { MfaOtpForm } from './mfa-otp-form';
import { EmailInput, PasswordInput } from '@asko/ui';

interface LoginFormProps {
  variant: 'mobile' | 'desktop';
}

export function LoginForm({ variant }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const login = useLogin();
  const verifyMfa = useVerifyMfaOtp();

  const [mfaState, setMfaState] = useState<{ mfaToken: string; mfaMethod: string } | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) return;
    login.mutate({ email, password }, {
      onSuccess: (data: any) => {
        if (data.status === 'MFA_REQUIRED') {
          setMfaState({ mfaToken: data.mfa_token, mfaMethod: data.mfa_method });
        }
      },
    });
  }

  const handleMfaSubmit = useCallback((code: string, trustDevice: boolean) => {
    if (!mfaState) return;
    verifyMfa.mutate({ mfaToken: mfaState.mfaToken, code, trustDevice });
  }, [mfaState, verifyMfa]);

  const handleMfaResend = useCallback(async () => {
    if (!mfaState) return { retryAfter: 0 };
    const { data } = await authApi.resendMfaOtp(mfaState.mfaToken);
    return data;
  }, [mfaState]);

  const handleMfaBack = useCallback(() => {
    setMfaState(null);
    login.reset();
    verifyMfa.reset();
  }, [login, verifyMfa]);

  const mfaError = verifyMfa.error
    ? (verifyMfa.error as any)?.response?.data?.message ?? 'Ошибка проверки кода'
    : null;

  if (mfaState) {
    return (
      <MfaOtpForm
        onSubmit={handleMfaSubmit}
        onResend={handleMfaResend}
        onBack={handleMfaBack}
        isPending={verifyMfa.isPending}
        error={mfaError}
        showTrustDevice
        variant={variant}
      />
    );
  }

  const errorMessage = login.error
    ? (login.error as any)?.response?.data?.message ?? 'Ошибка авторизации'
    : null;

  const labelColor = variant === 'mobile' ? 'text-[#F1F1F1]' : 'text-text-main';
  const errorBg = variant === 'mobile' ? 'bg-red-600/80' : 'bg-red-600';

  return (
    <>
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {errorMessage && (
          <div className={`px-3 py-2 text-sm text-white ${errorBg}`}>{errorMessage}</div>
        )}

        <div className={`flex flex-col ${variant === 'desktop' ? 'gap-8' : 'gap-6'}`}>
          <div className="flex flex-col gap-2">
            <label className={`text-2xl font-medium leading-7 tracking-[-0.01em] ${labelColor}`}>Email</label>
            <EmailInput value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" required />
          </div>

          <div className="flex flex-col gap-2">
            <label className={`text-2xl font-medium leading-7 tracking-[-0.01em] ${labelColor}`}>Пароль</label>
            <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Введите пароль" showStrength={false} required />
          </div>
        </div>

        <button
          type="submit"
          disabled={login.isPending}
          className={`flex items-center justify-center ${variant === 'mobile' ? 'w-full' : 'w-fit px-6 cursor-pointer'} h-10 text-sm font-medium tracking-[0.005em] text-white shadow-sm disabled:opacity-60`}
          style={{ background: '#EB001C' }}
        >
          {login.isPending ? 'Загрузка...' : 'Авторизироваться'}
        </button>

        {variant === 'mobile' && (
          <Link href="/reset" className="text-2xl font-medium leading-7 tracking-[-0.01em] text-[#F1F1F1]">
            Забыли пароль?
          </Link>
        )}
      </form>

      {variant === 'desktop' && (
        <Link href="/reset" className="block mt-12 text-sm font-medium leading-[22px] tracking-[-0.01em] text-text-main">
          Забыли пароль?
        </Link>
      )}
    </>
  );
}
