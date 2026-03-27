'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { LandingHeader } from '@/components/landing/header';
import { authApi } from '@/lib/api/auth';
import { EmailInput, PasswordInput } from '@asko/ui';
import {
  MIN_USER_PASSWORD_LENGTH,
  MAX_USER_PASSWORD_LENGTH,
} from '@asko/shared/client';

// ─── Request reset token form ──────────────────────────────────────────────

function RequestResetForm() {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryAfter, setRetryAfter] = useState(0);

  useEffect(() => {
    if (retryAfter <= 0) return;
    const timer = setInterval(() => setRetryAfter((v) => Math.max(0, v - 1)), 1000);
    return () => clearInterval(timer);
  }, [retryAfter]);

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!email || sending || retryAfter > 0) return;

    setSending(true);
    setError(null);
    try {
      const { data } = await authApi.forgotPassword(email);
      setSent(true);
      setRetryAfter(data.retryAfter ?? 60);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Не удалось отправить письмо');
    } finally {
      setSending(false);
    }
  }, [email, sending, retryAfter]);

  const handleResend = useCallback(async () => {
    if (!email || sending || retryAfter > 0) return;
    setSending(true);
    setError(null);
    try {
      const { data } = await authApi.forgotPassword(email);
      setRetryAfter(data.retryAfter ?? 60);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Не удалось отправить письмо');
    } finally {
      setSending(false);
    }
  }, [email, sending, retryAfter]);

  const formContent = (variant: 'mobile' | 'desktop') => {
    const labelColor = variant === 'mobile' ? 'text-[#F1F1F1]' : 'text-text-main';

    if (sent) {
      return (
        <div className="flex flex-col gap-6">
          <p className={`text-2xl font-medium leading-7 tracking-[-0.01em] ${labelColor}`}>
            Письмо отправлено
          </p>
          <p className={`text-sm ${variant === 'mobile' ? 'text-[#A6A6A6]' : 'text-text-sub'}`}>
            Если аккаунт с адресом <strong>{email}</strong> существует, на него отправлена ссылка для сброса пароля.
          </p>

          <button
            type="button"
            onClick={handleResend}
            disabled={sending || retryAfter > 0}
            className="flex items-center justify-center w-full lg:w-fit px-6 h-10 text-sm font-medium tracking-[0.005em] text-white shadow-sm cursor-pointer disabled:opacity-60"
            style={{ background: '#EB001C' }}
          >
            {retryAfter > 0
              ? `Отправить повторно (${retryAfter}с)`
              : sending
                ? 'Отправка...'
                : 'Отправить повторно'}
          </button>

          {error && (
            <div className="px-3 py-2 text-sm text-white bg-red-600/80">{error}</div>
          )}

          <Link
            href="/login"
            className={`text-sm font-medium ${labelColor}`}
          >
            Вернуться к авторизации
          </Link>
        </div>
      );
    }

    return (
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {error && (
          <div className={`px-3 py-2 text-sm text-white ${variant === 'mobile' ? 'bg-red-600/80' : 'bg-red-600'}`}>
            {error}
          </div>
        )}

        <div className="flex flex-col gap-8">
          <p className={`text-2xl font-medium leading-7 tracking-[-0.01em] ${labelColor}`}>
            Сброс пароля
          </p>
          <p className={`text-sm ${variant === 'mobile' ? 'text-[#A6A6A6]' : 'text-text-sub'}`}>
            Введите email, привязанный к вашему аккаунту. Мы отправим ссылку для сброса пароля.
          </p>

          <div className="flex flex-col gap-2">
            <label className={`text-2xl font-medium leading-7 tracking-[-0.01em] ${labelColor}`}>
              Email
            </label>
            <EmailInput
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={sending || !email}
          className="flex items-center justify-center w-full lg:w-fit px-6 h-10 text-sm font-medium tracking-[0.005em] text-white shadow-sm cursor-pointer disabled:opacity-60"
          style={{ background: '#EB001C' }}
        >
          {sending ? 'Отправка...' : 'Отправить ссылку'}
        </button>

        <Link
          href="/login"
          className={`text-sm font-medium ${labelColor}`}
        >
          Вернуться к авторизации
        </Link>
      </form>
    );
  };

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
            <div className="flex-1">{formContent('mobile')}</div>
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
            {formContent('desktop')}
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

// ─── Reset password form (with token) ──────────────────────────────────────

function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [confirmTouched, setConfirmTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const passwordsMatch = newPassword === confirmPassword;
  const showConfirmError = confirmTouched && confirmPassword.length > 0 && !passwordsMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || submitting) return;

    if (!passwordsMatch) {
      setConfirmTouched(true);
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await authApi.resetPassword(token, newPassword);
      setSuccess(true);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Не удалось сбросить пароль');
    } finally {
      setSubmitting(false);
    }
  };

  const formContent = (variant: 'mobile' | 'desktop') => {
    const labelColor = variant === 'mobile' ? 'text-[#F1F1F1]' : 'text-text-main';

    if (success) {
      return (
        <div className="flex flex-col gap-6">
          <p className={`text-2xl font-medium leading-7 tracking-[-0.01em] ${labelColor}`}>
            Пароль изменён
          </p>
          <p className={`text-sm ${variant === 'mobile' ? 'text-[#A6A6A6]' : 'text-text-sub'}`}>
            Ваш пароль успешно изменён. Теперь вы можете войти с новым паролем.
          </p>
          <button
            type="button"
            onClick={() => router.push('/login')}
            className="flex items-center justify-center w-full lg:w-fit px-6 h-10 text-sm font-medium tracking-[0.005em] text-white shadow-sm cursor-pointer"
            style={{ background: '#EB001C' }}
          >
            Войти
          </button>
        </div>
      );
    }

    return (
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {error && (
          <div className={`px-3 py-2 text-sm text-white ${variant === 'mobile' ? 'bg-red-600/80' : 'bg-red-600'}`}>
            {error}
          </div>
        )}

        <div className="flex flex-col gap-8">
          <p className={`text-2xl font-medium leading-7 tracking-[-0.01em] ${labelColor}`}>
            Новый пароль
          </p>

          <div className="flex flex-col gap-2">
            <label className={`text-2xl font-medium leading-7 tracking-[-0.01em] ${labelColor}`}>
              Пароль
            </label>
            <PasswordInput
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Придумайте новый пароль"
              minLength={MIN_USER_PASSWORD_LENGTH}
              maxLength={MAX_USER_PASSWORD_LENGTH}
              required
            />
          </div>

          {newPassword.length > 0 && (
            <div className="flex flex-col gap-2">
              <label className={`text-2xl font-medium leading-7 tracking-[-0.01em] ${labelColor}`}>
                Повторите пароль
              </label>
              <PasswordInput
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (!confirmTouched) setConfirmTouched(true);
                }}
                onBlur={() => setConfirmTouched(true)}
                placeholder="Повторите пароль"
                showStrength={false}
                error={showConfirmError}
                required
              />
              {showConfirmError && (
                <p className="text-xs text-brand-red">Пароли не совпадают</p>
              )}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={submitting || (newPassword.length > 0 && !passwordsMatch)}
          className="flex items-center justify-center w-full lg:w-fit px-6 h-10 text-sm font-medium tracking-[0.005em] text-white shadow-sm cursor-pointer disabled:opacity-60"
          style={{ background: '#EB001C' }}
        >
          {submitting ? 'Сохранение...' : 'Сбросить пароль'}
        </button>

        <Link
          href="/login"
          className={`text-sm font-medium ${labelColor}`}
        >
          Вернуться к авторизации
        </Link>
      </form>
    );
  };

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
            <div className="flex-1">{formContent('mobile')}</div>
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
            {formContent('desktop')}
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

// ─── Page router ────────────────────────────────────────────────────────────

function ResetPageContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  if (token) {
    return <ResetPasswordForm token={token} />;
  }

  return <RequestResetForm />;
}

export default function ResetPage() {
  return (
    <Suspense>
      <ResetPageContent />
    </Suspense>
  );
}
