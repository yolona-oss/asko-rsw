'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { LandingHeader } from '@/components/landing/header';
import { authApi } from '@/lib/api/auth';

function ConfirmEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMessage('Токен подтверждения не найден');
      return;
    }

    authApi.confirmEmail(token)
      .then(() => setStatus('success'))
      .catch((err) => {
        setStatus('error');
        setErrorMessage(err?.response?.data?.message ?? 'Не удалось подтвердить email');
      });
  }, [token]);

  const content = (variant: 'mobile' | 'desktop') => {
    const labelColor = variant === 'mobile' ? 'text-[#F1F1F1]' : 'text-text-main';
    const subColor = variant === 'mobile' ? 'text-[#A6A6A6]' : 'text-text-sub';

    if (status === 'loading') {
      return (
        <div className="flex flex-col gap-6">
          <p className={`text-2xl font-medium leading-7 tracking-[-0.01em] ${labelColor}`}>
            Подтверждение email
          </p>
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" style={{ color: '#EB001C' }} />
            <p className={`text-sm ${subColor}`}>Подтверждаем ваш email...</p>
          </div>
        </div>
      );
    }

    if (status === 'success') {
      return (
        <div className="flex flex-col gap-6">
          <p className={`text-2xl font-medium leading-7 tracking-[-0.01em] ${labelColor}`}>
            Email подтверждён
          </p>
          <p className={`text-sm ${subColor}`}>
            Ваш email успешно подтверждён.
          </p>
          <button
            type="button"
            onClick={() => router.push('/account')}
            className="flex items-center justify-center w-full lg:w-fit px-6 h-10 text-sm font-medium tracking-[0.005em] text-white shadow-sm cursor-pointer"
            style={{ background: '#EB001C' }}
          >
            Перейти в аккаунт
          </button>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-6">
        <p className={`text-2xl font-medium leading-7 tracking-[-0.01em] ${labelColor}`}>
          Ошибка подтверждения
        </p>
        <div className={`px-3 py-2 text-sm text-white ${variant === 'mobile' ? 'bg-red-600/80' : 'bg-red-600'}`}>
          {errorMessage}
        </div>
        <p className={`text-sm ${subColor}`}>
          Ссылка могла истечь. Запросите новое письмо в настройках профиля.
        </p>
        <div className="flex gap-4">
          <Link
            href="/login"
            className="flex items-center justify-center w-fit px-6 h-10 text-sm font-medium tracking-[0.005em] text-white shadow-sm cursor-pointer"
            style={{ background: '#EB001C' }}
          >
            Войти
          </Link>
        </div>
      </div>
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
            <div className="flex-1">{content('mobile')}</div>
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
            {content('desktop')}
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

export default function ConfirmEmailPage() {
  return (
    <Suspense>
      <ConfirmEmailContent />
    </Suspense>
  );
}
