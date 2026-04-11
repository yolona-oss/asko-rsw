'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { authApi } from '@/lib/api/auth';
import { EmailInput } from '@asko/ui';

interface RequestResetFormProps {
  variant: 'mobile' | 'desktop';
}

export function RequestResetForm({ variant }: RequestResetFormProps) {
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

  const labelColor = variant === 'mobile' ? 'text-page-bg' : 'text-text-main';
  const subColor = variant === 'mobile' ? 'text-text-muted' : 'text-text-sub';
  const errorBg = variant === 'mobile' ? 'bg-brand-red/80' : 'bg-brand-red';

  if (sent) {
    return (
      <div className="flex flex-col gap-6">
        <p className={`text-2xl font-medium leading-7 tracking-[-0.01em] ${labelColor}`}>
          Письмо отправлено
        </p>
        <p className={`text-sm ${subColor}`}>
          Если аккаунт с адресом <strong>{email}</strong> существует, на него отправлена ссылка для сброса пароля.
        </p>

        <button
          type="button"
          onClick={handleResend}
          disabled={sending || retryAfter > 0}
          className={`flex items-center justify-center ${variant === 'mobile' ? 'w-full' : 'w-fit'} px-6 h-10 text-sm font-medium tracking-[0.005em] text-text-on-brand bg-brand-red shadow-sm cursor-pointer disabled:opacity-60`}
        >
          {retryAfter > 0
            ? `Отправить повторно (${retryAfter}с)`
            : sending
              ? 'Отправка...'
              : 'Отправить повторно'}
        </button>

        {error && (
          <div className={`px-3 py-2 text-sm text-text-on-brand ${errorBg}`}>{error}</div>
        )}

        <Link href="/login" className={`text-sm font-medium ${labelColor}`}>
          Вернуться к авторизации
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {error && (
        <div className={`px-3 py-2 text-sm text-text-on-brand ${errorBg}`}>{error}</div>
      )}

      <div className="flex flex-col gap-8">
        <p className={`text-2xl font-medium leading-7 tracking-[-0.01em] ${labelColor}`}>
          Сброс пароля
        </p>
        <p className={`text-sm ${subColor}`}>
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
        className={`flex items-center justify-center ${variant === 'mobile' ? 'w-full' : 'w-fit'} px-6 h-10 text-sm font-medium tracking-[0.005em] text-text-on-brand bg-brand-red shadow-sm cursor-pointer disabled:opacity-60`}
      >
        {sending ? 'Отправка...' : 'Отправить ссылку'}
      </button>

      <Link href="/login" className={`text-sm font-medium ${labelColor}`}>
        Вернуться к авторизации
      </Link>
    </form>
  );
}
