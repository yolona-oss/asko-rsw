'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { LandingHeader } from '@/components/landing/header';
import { useLogin, useVerifyMfaOtp } from '@/lib/api/use-auth';
import { authApi } from '@/lib/api/auth';
import { MfaOtpForm } from '@/components/auth/mfa-otp-form';
import { EmailInput, PasswordInput } from '@asko/ui';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const login = useLogin();
  const verifyMfa = useVerifyMfaOtp();

  // MFA state
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

  const errorMessage = login.error
    ? (login.error as any)?.response?.data?.message ?? 'Ошибка авторизации'
    : null;

  const mfaError = verifyMfa.error
    ? (verifyMfa.error as any)?.response?.data?.message ?? 'Ошибка проверки кода'
    : null;

  // ─── MFA OTP form content ──────────────────────────────────────────────

  const mfaContent = (variant: 'mobile' | 'desktop') => (
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

  // ─── If MFA required — show OTP form ──────────────────────────────────

  if (mfaState) {
    return (
      <>
        {/* Mobile */}
        <div className="lg:hidden flex flex-col min-h-screen">
          <LandingHeader />
          <div className="relative flex-1 flex flex-col">
            <div className="absolute inset-0">
              <Image src="/images/auth-img.webp" alt="" fill className="object-cover" />
              <div className="absolute inset-0 bg-black/65" />
            </div>
            <div className="relative z-10 flex flex-col flex-1 px-4 pt-8 pb-10">
              <div className="flex-1">{mfaContent('mobile')}</div>
              <div className="flex justify-center mt-8">
                <Image src="/images/logo.svg" alt="ASKO" width={280} height={84} className="brightness-0 invert" />
              </div>
            </div>
          </div>
        </div>

        {/* Desktop */}
        <div className="hidden lg:flex items-center justify-center min-h-screen bg-page-bg">
          <div className="relative w-[1120px] h-[676px] bg-white">
            <div className="absolute left-6 top-1/2 -translate-y-1/2 w-[446px]">
              {mfaContent('desktop')}
            </div>
            <div className="absolute right-0 top-0 w-[551px] h-full flex flex-col justify-end items-center pb-10 overflow-hidden">
              <Image src="/images/auth-img.webp" alt="" fill className="object-cover" />
              <div className="relative z-10">
                <Image src="/images/logo.svg" alt="ASKO" width={494} height={148} className="brightness-0 invert" />
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ─── Normal login form ────────────────────────────────────────────────

  return (
    <>
      {/* Mobile layout */}
      <div className="lg:hidden flex flex-col min-h-screen">
        <LandingHeader />
        <div className="relative flex-1 flex flex-col">
          <div className="absolute inset-0">
            <Image src="/images/auth-img.webp" alt="" fill className="object-cover" />
            <div className="absolute inset-0 bg-black/65" />
          </div>

          <form onSubmit={handleSubmit} className="relative z-10 flex flex-col flex-1 px-4 pt-8 pb-10">
            <div className="flex flex-col gap-6 flex-1">
              {errorMessage && (
                <div className="px-3 py-2 text-sm text-white bg-red-600/80">{errorMessage}</div>
              )}

              <div className="flex flex-col gap-2">
                <label className="text-2xl font-medium leading-7 tracking-[-0.01em] text-[#F1F1F1]">Email</label>
                <EmailInput value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" required />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-2xl font-medium leading-7 tracking-[-0.01em] text-[#F1F1F1]">Пароль</label>
                <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Введите пароль" showStrength={false} required />
              </div>

              <button
                type="submit"
                disabled={login.isPending}
                className="flex items-center justify-center w-full h-10 text-sm font-medium tracking-[0.005em] text-white shadow-sm disabled:opacity-60"
                style={{ background: '#EB001C' }}
              >
                {login.isPending ? 'Загрузка...' : 'Авторизироваться'}
              </button>

              <Link href="/reset" className="text-2xl font-medium leading-7 tracking-[-0.01em] text-[#F1F1F1]">
                Забыли пароль?
              </Link>
            </div>

            <div className="flex justify-center mt-8">
              <Image src="/images/logo.svg" alt="ASKO" width={280} height={84} className="brightness-0 invert" />
            </div>
          </form>
        </div>
      </div>

      {/* Desktop layout */}
      <div className="hidden lg:flex items-center justify-center min-h-screen bg-page-bg">
        <div className="relative w-[1120px] h-[676px] bg-white">
          <div className="absolute left-6 top-1/2 -translate-y-1/2 w-[446px]">
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              {errorMessage && (
                <div className="px-3 py-2 text-sm text-white bg-red-600">{errorMessage}</div>
              )}

              <div className="flex flex-col gap-8">
                <div className="flex flex-col gap-2">
                  <label className="text-2xl font-medium leading-7 tracking-[-0.01em] text-text-main">Email</label>
                  <EmailInput value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" required />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-2xl font-medium leading-7 tracking-[-0.01em] text-text-main">Пароль</label>
                  <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Введите пароль" showStrength={false} required />
                </div>
              </div>

              <button
                type="submit"
                disabled={login.isPending}
                className="flex items-center justify-center w-fit px-6 h-10 text-sm font-medium tracking-[0.005em] text-white shadow-sm cursor-pointer disabled:opacity-60"
                style={{ background: '#EB001C' }}
              >
                {login.isPending ? 'Загрузка...' : 'Авторизироваться'}
              </button>
            </form>

            <Link href="/reset" className="block mt-12 text-sm font-medium leading-[22px] tracking-[-0.01em] text-text-main">
              Забыли пароль?
            </Link>
          </div>

          <div className="absolute right-0 top-0 w-[551px] h-full flex flex-col justify-end items-center pb-10 overflow-hidden">
            <Image src="/images/auth-img.webp" alt="" fill className="object-cover" />
            <div className="relative z-10">
              <Image src="/images/logo.svg" alt="ASKO" width={494} height={148} className="brightness-0 invert" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
