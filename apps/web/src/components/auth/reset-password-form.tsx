'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authApi } from '@/lib/api/auth';
import { PasswordInput } from '@asko/ui';
import {
  MIN_USER_PASSWORD_LENGTH,
  MAX_USER_PASSWORD_LENGTH,
} from '@asko/shared/client';

interface ResetPasswordFormProps {
  variant: 'mobile' | 'desktop';
  token: string;
}

export function ResetPasswordForm({ variant, token }: ResetPasswordFormProps) {
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

  const labelColor = variant === 'mobile' ? 'text-text-on-dark' : 'text-text-main';
  const subColor = variant === 'mobile' ? 'text-text-muted' : 'text-text-sub';
  const errorBg = variant === 'mobile' ? 'bg-brand-red/80' : 'bg-brand-red';

  if (success) {
    return (
      <div className="flex flex-col gap-6">
        <p className={`text-2xl font-medium leading-7 tracking-[-0.01em] ${labelColor}`}>
          Пароль изменён
        </p>
        <p className={`text-sm ${subColor}`}>
          Ваш пароль успешно изменён. Теперь вы можете войти с новым паролем.
        </p>
        <button
          type="button"
          onClick={() => router.push('/login')}
          className={`flex items-center justify-center ${variant === 'mobile' ? 'w-full' : 'w-fit'} px-6 h-10 text-sm font-medium tracking-[0.005em] text-text-on-brand bg-brand-red shadow-sm cursor-pointer`}
        >
          Войти
        </button>
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
        className={`flex items-center justify-center ${variant === 'mobile' ? 'w-full' : 'w-fit'} px-6 h-10 text-sm font-medium tracking-[0.005em] text-text-on-brand bg-brand-red shadow-sm cursor-pointer disabled:opacity-60`}
      >
        {submitting ? 'Сохранение...' : 'Сбросить пароль'}
      </button>

      <Link href="/login" className={`text-sm font-medium ${labelColor}`}>
        Вернуться к авторизации
      </Link>
    </form>
  );
}
