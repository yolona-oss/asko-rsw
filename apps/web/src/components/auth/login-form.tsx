'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useLogin, useVerifyMfaOtp } from '@/lib/api/use-auth';
import { authApi } from '@/lib/api/auth';
import { MfaOtpForm } from './mfa-otp-form';
import { PhoneOtpForm } from './phone-otp-form';
import { CredentialInput, type CredentialType } from './credential-input';
import { OAuthButtons } from './oauth-buttons';
import { PasswordInput } from '@asko/ui';

interface LoginFormProps {
  variant: 'mobile' | 'desktop';
}

export function LoginForm({ variant }: LoginFormProps) {
  const [credential, setCredential] = useState('');
  const [credentialType, setCredentialType] = useState<CredentialType>(null);
  const [password, setPassword] = useState('');
  const login = useLogin();
  const verifyMfa = useVerifyMfaOtp();

  // MFA / Phone OTP state (unified — both use challenge token flow)
  const [mfaState, setMfaState] = useState<{ mfaToken: string; mfaMethod: string } | null>(null);

  function handleCredentialChange(value: string, type: CredentialType) {
    setCredential(value);
    setCredentialType(type);
    if (login.error) login.reset();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!credential) return;

    if (credentialType === 'phone') {
      // Phone login — sends SMS OTP, returns MFA_REQUIRED
      const phone = credential.replace(/\D/g, '');
      login.mutate({ phone }, {
        onSuccess: (data: any) => {
          if (data.status === 'MFA_REQUIRED') {
            setMfaState({ mfaToken: data.mfa_token, mfaMethod: data.mfa_method });
          }
        },
      });
      return;
    }

    // Email login
    if (!password) return;
    login.mutate({ email: credential, password }, {
      onSuccess: (data: any) => {
        if (data.status === 'MFA_REQUIRED') {
          setMfaState({ mfaToken: data.mfa_token, mfaMethod: data.mfa_method });
        }
      },
    });
  }

  // ─── MFA / OTP handlers ──────────────────────────────────────────

  const handleMfaSubmit = useCallback((code: string, trustDevice: boolean) => {
    if (!mfaState) return;
    verifyMfa.mutate({ mfaToken: mfaState.mfaToken, code, trustDevice });
  }, [mfaState, verifyMfa]);

  const handlePhoneOtpVerify = useCallback((code: string) => {
    if (!mfaState) return;
    verifyMfa.mutate({ mfaToken: mfaState.mfaToken, code });
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

  // ─── Step 2: Phone OTP ─────────────────────────────────────────

  if (mfaState && mfaState.mfaMethod === 'phone') {
    return (
      <PhoneOtpForm
        phone={credential}
        onVerify={handlePhoneOtpVerify}
        onResend={handleMfaResend}
        onBack={handleMfaBack}
        isPending={verifyMfa.isPending}
        error={mfaError}
        variant={variant}
      />
    );
  }

  // ─── Step 2: Email MFA OTP ─────────────────────────────────────

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

  // ─── Step 1: Credentials ─────────────────────────────────────────

  const errorMessage = login.error
    ? (login.error as any)?.response?.data?.message ?? 'Ошибка авторизации'
    : null;

  const labelColor = variant === 'mobile' ? 'text-text-on-dark' : 'text-text-main';
  const errorBg = variant === 'mobile' ? 'bg-brand-red/80' : 'bg-brand-red';
  const showPassword = credentialType !== 'phone';

  return (
    <>
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {errorMessage && (
          <div className={`px-3 py-2 text-sm text-text-on-brand ${errorBg}`}>{errorMessage}</div>
        )}

        <div className={`flex flex-col ${variant === 'desktop' ? 'gap-8' : 'gap-6'}`}>
          <div className="flex flex-col gap-2">
            <label className={`text-2xl font-medium leading-7 tracking-[-0.01em] ${labelColor}`}>
              Email или телефон
            </label>
            <CredentialInput
              value={credential}
              onChange={handleCredentialChange}
              required
            />
          </div>

          {showPassword && (
            <div className="flex flex-col gap-2">
              <label className={`text-2xl font-medium leading-7 tracking-[-0.01em] ${labelColor}`}>Пароль</label>
              <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Введите пароль" showStrength={false} required />
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={login.isPending}
          className={`flex items-center justify-center ${variant === 'mobile' ? 'w-full' : 'w-fit px-6 cursor-pointer'} h-10 text-sm font-medium tracking-[0.005em] text-text-on-brand bg-brand-red shadow-sm disabled:opacity-60`}
        >
          {login.isPending
            ? 'Загрузка...'
            : credentialType === 'phone'
              ? 'Получить код'
              : 'Авторизироваться'}
        </button>

        {showPassword && variant === 'mobile' && (
          <Link href="/reset" className="text-2xl font-medium leading-7 tracking-[-0.01em] text-text-on-dark">
            Забыли пароль?
          </Link>
        )}
      </form>

      <div className={`flex items-center gap-3 ${variant === 'desktop' ? 'mt-6' : 'mt-4'}`}>
        <div className="flex-1 h-px bg-border-light" />
        <span className={`text-xs ${variant === 'mobile' ? 'text-text-muted' : 'text-text-sub'}`}>или</span>
        <div className="flex-1 h-px bg-border-light" />
      </div>

      <OAuthButtons className={variant === 'desktop' ? 'mt-4' : 'mt-3'} />

      {showPassword && variant === 'desktop' && (
        <Link href="/reset" className="block mt-12 text-sm font-medium leading-[22px] tracking-[-0.01em] text-text-main">
          Забыли пароль?
        </Link>
      )}

      <p className={`${variant === 'desktop' ? 'mt-4' : 'mt-6'} text-sm ${variant === 'mobile' ? 'text-text-muted' : 'text-text-sub'}`}>
        Нет аккаунта?{' '}
        <Link href="/register" className={`font-medium ${labelColor}`}>
          Зарегистрироваться
        </Link>
      </p>
    </>
  );
}
