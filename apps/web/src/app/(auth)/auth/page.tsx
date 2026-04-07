'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { LandingHeader } from '@/components/landing/header';
import { EmailInput } from '@asko/ui';

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const router = useRouter();

  // Returning users → login page
  useEffect(() => {
    if (localStorage.getItem('has_account')) {
      router.replace('/login');
    }
  }, [router]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const url = email ? `/register?email=${encodeURIComponent(email)}` : '/register';
    router.push(url);
  }

  return (
    <>
      {/* Mobile layout */}
      <div className="lg:hidden flex flex-col min-h-screen">
        <LandingHeader />
        <div
          className="relative flex-1 flex flex-col items-center px-4 pt-12 pb-10 overflow-hidden"
          style={{ background: '#151515' }}
        >
          {/* Decorative blurred ellipses */}
          <div
            className="absolute w-[631px] h-[329px] -left-[416px] top-[53px] rotate-[60deg] pointer-events-none animate-[glow-drift-2_10s_ease-in-out_infinite]"
            style={{ background: 'rgba(235, 0, 28, 0.11)', filter: 'blur(61.6px)' }}
          />
          <div
            className="absolute w-[1290px] h-[428px] -left-[125px] -top-[502px] -rotate-[150deg] pointer-events-none animate-[glow-drift-1_8s_ease-in-out_infinite]"
            style={{ background: 'rgba(235, 0, 28, 0.18)', filter: 'blur(69.3px)' }}
          />

          <div className="relative z-10 flex flex-col items-center w-full max-w-[358px] gap-14">
            {/* Form */}
            <div className="flex flex-col items-center w-full gap-8">
              {/* Header */}
              <div className="flex flex-col items-center gap-2 w-full">
                <div className="flex flex-col items-center gap-4">
                  <h1 className="text-2xl font-medium leading-7 tracking-[-0.01em] text-center text-[#F0F0F1]">
                    Создание аккаунта
                  </h1>
                  <p className="text-sm leading-[18px] tracking-[-0.01em] text-center text-[#A6A6A6]">
                    Создайте аккаунт для доступа к личному кабинету
                  </p>
                </div>
                <p className="text-sm leading-[18px] tracking-[-0.01em] text-center text-[#A6A6A6]">
                  Регистрация техники &bull; Сервисное обслуживание &bull; Статус ремонта
                </p>
              </div>

              {/* Input + Button */}
              <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
                <EmailInput
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                />
                <button
                  type="submit"
                  className="flex items-center justify-center w-full h-10 text-sm font-medium text-white shadow-sm cursor-pointer"
                  style={{ background: '#D7102A' }}
                >
                  Создать аккаунт
                </button>
              </form>

              {/* Divider */}
              <div className="flex items-center gap-1 w-full">
                <div className="flex-1 h-px bg-[#D9D9D9] opacity-72" />
                <span className="text-sm leading-[18px] tracking-[-0.01em] text-center text-white whitespace-nowrap px-2">
                  Уже есть аккаунт?
                </span>
                <div className="flex-1 h-px bg-[#D9D9D9] opacity-72" />
              </div>

              {/* Login button */}
              <Link
                href="/login"
                className="flex items-center justify-center w-full h-10 text-sm font-medium text-white bg-[#323232] shadow-sm cursor-pointer"
              >
                Войти
              </Link>
            </div>

            {/* ASKO logo */}
            <Image
              src="/images/logo.svg"
              alt="ASKO"
              width={280}
              height={84}
              className="brightness-0 invert"
            />
          </div>
        </div>
      </div>

      {/* Desktop layout */}
      <div className="hidden lg:flex items-center justify-center min-h-screen bg-surface">
        {/* Left: dark panel */}
        <div className="relative w-[1120px] h-[676px] bg-surface flex">
          <div
            className="relative w-1/2 overflow-hidden"
            style={{ background: '#151515', boxShadow: '0px 10px 60px rgba(226, 236, 249, 0.5)' }}
          >
            {/* Decorative blurred ellipses */}
            <div
              className="absolute w-[631px] h-[329px] -left-[416px] top-[53px] rotate-[60deg]"
              style={{ background: 'rgba(235, 0, 28, 0.11)', filter: 'blur(61.6px)' }}
            />
            <div
              className="absolute w-[1290px] h-[428px] -left-[125px] -top-[502px] -rotate-[150deg]"
              style={{ background: 'rgba(235, 0, 28, 0.18)', filter: 'blur(69.3px)' }}
            />

            {/* Centered ASKO logo */}
            <div className="absolute inset-0 flex items-center justify-center">
              <Image
                src="/images/logo.svg"
                alt="ASKO"
                width={494}
                height={148}
                className="brightness-0 invert"
              />
            </div>
          </div>

          {/* Right: form */}
          <div className="relative w-1/2 bg-page-bg flex items-center justify-center">
            <div className="flex flex-col gap-14 w-[446px]">
              {/* Top section: title + features + input + button */}
              <div className="flex flex-col items-center gap-8">
                {/* Title */}
                <div className="flex flex-col items-center gap-2 w-full">
                  <div className="flex flex-col items-center gap-4">
                    <h1 className="text-2xl font-medium leading-7 tracking-[-0.01em] text-center text-text-main">
                      Создание аккаунта
                    </h1>
                    <p className="text-sm leading-[18px] tracking-[-0.01em] text-center text-[#A6A6A6]">
                      Создайте аккаунт для доступа к личному кабинету
                    </p>
                  </div>
                  <p className="text-sm leading-[18px] tracking-[-0.01em] text-center text-text-main">
                    Регистрация техники &bull; Сервисное обслуживание &bull; Статус ремонта
                  </p>
                </div>

                {/* Input + Button */}
                <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
                  <EmailInput
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@email.com"
                  />
                  <button
                    type="submit"
                    className="flex items-center justify-center w-full h-10 text-sm font-medium tracking-[0.005em] text-white shadow-sm cursor-pointer"
                    style={{ background: '#D7102A' }}
                  >
                    Создать аккаунт
                  </button>
                </form>
              </div>

              {/* Bottom: divider + login */}
              <div className="flex flex-col gap-8 w-full">
                {/* Divider with text */}
                <div className="flex items-center gap-1 w-full">
                  <div className="flex-1 h-px bg-[#D9D9D9] opacity-72" />
                  <span className="text-sm leading-[18px] tracking-[-0.01em] text-center text-text-main whitespace-nowrap px-2">
                    Уже есть аккаунт?
                  </span>
                  <div className="flex-1 h-px bg-[#D9D9D9] opacity-72" />
                </div>

                {/* Login button */}
                <Link
                  href="/login"
                  className="flex items-center justify-center w-full h-10 text-sm font-medium tracking-[0.005em] text-white bg-[#323232] shadow-sm"
                >
                  Войти
                </Link>
              </div>
            </div>

            {/* Bottom disclaimer */}
            <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-sm leading-[18px] tracking-[-0.01em] text-[#A6A6A6] whitespace-nowrap">
              Регистрируясь, вы соглашаетесь на обработку персональных данных
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
