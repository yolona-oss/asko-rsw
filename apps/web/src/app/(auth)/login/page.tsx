'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { LandingHeader } from '@/components/landing/header';
import { useLogin } from '@/lib/api/use-auth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const login = useLogin();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) return;
    login.mutate({ email, password });
  }

  const errorMessage = login.error
    ? (login.error as any)?.response?.data?.message ?? 'Ошибка авторизации'
    : null;

  return (
    <>
      {/* Mobile layout */}
      <div className="lg:hidden flex flex-col min-h-screen">
        <LandingHeader />
        <div className="relative flex-1 flex flex-col">
          {/* Background image */}
          <div className="absolute inset-0">
            <Image
              src="/images/auth-img.png"
              alt=""
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black/65" />
          </div>

          {/* Form content */}
          <form onSubmit={handleSubmit} className="relative z-10 flex flex-col flex-1 px-4 pt-8 pb-10">
            <div className="flex flex-col gap-6 flex-1">
              {errorMessage && (
                <div className="px-3 py-2 text-sm text-white bg-red-600/80">{errorMessage}</div>
              )}

              {/* Email */}
              <div className="flex flex-col gap-2">
                <label className="text-2xl font-medium leading-7 tracking-[-0.01em] text-[#F1F1F1]">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  className="w-full h-9 px-3 text-sm bg-white border border-[#E2E8F0] text-[#737373] placeholder:text-[#737373] outline-none"
                  required
                />
              </div>

              {/* Пароль */}
              <div className="flex flex-col gap-2">
                <label className="text-2xl font-medium leading-7 tracking-[-0.01em] text-[#F1F1F1]">
                  Пароль
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Введите пароль"
                  className="w-full h-9 px-3 text-sm bg-white border border-[#E2E8F0] text-[#B5B7C0] placeholder:text-[#B5B7C0] outline-none"
                  required
                />
              </div>

              {/* Button */}
              <button
                type="submit"
                disabled={login.isPending}
                className="flex items-center justify-center w-full h-10 text-sm font-medium tracking-[0.005em] text-white shadow-sm disabled:opacity-60"
                style={{ background: '#EB001C' }}
              >
                {login.isPending ? 'Загрузка...' : 'Авторизироваться'}
              </button>

              {/* Forgot password */}
              <Link
                href="#"
                className="text-2xl font-medium leading-7 tracking-[-0.01em] text-[#F1F1F1]"
              >
                Забыли пароль?
              </Link>
            </div>

            {/* ASKO logo */}
            <div className="flex justify-center mt-8">
              <Image
                src="/images/logo.svg"
                alt="ASKO"
                width={280}
                height={84}
                className="brightness-0 invert"
              />
            </div>
          </form>
        </div>
      </div>

      {/* Desktop layout */}
      <div className="hidden lg:flex items-center justify-center min-h-screen bg-page-bg">
        <div className="relative w-[1120px] h-[676px] bg-white">
          {/* Left: form */}
          <div className="absolute left-6 top-1/2 -translate-y-1/2 w-[446px]">
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              {errorMessage && (
                <div className="px-3 py-2 text-sm text-white bg-red-600">{errorMessage}</div>
              )}

              <div className="flex flex-col gap-8">
                {/* Email */}
                <div className="flex flex-col gap-2">
                  <label className="text-2xl font-medium leading-7 tracking-[-0.01em] text-text-main">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@email.com"
                    className="w-full h-9 px-3 text-sm bg-white border border-[#E2E8F0] text-[#737373] placeholder:text-[#737373] outline-none"
                    required
                  />
                </div>

                {/* Пароль */}
                <div className="flex flex-col gap-2">
                  <label className="text-2xl font-medium leading-7 tracking-[-0.01em] text-text-main">
                    Пароль
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Введите пароль"
                    className="w-full h-9 px-3 text-sm bg-white border border-[#E2E8F0] text-[#B5B7C0] placeholder:text-[#B5B7C0] outline-none"
                    required
                  />
                </div>
              </div>

              {/* Button */}
              <button
                type="submit"
                disabled={login.isPending}
                className="flex items-center justify-center w-fit px-6 h-10 text-sm font-medium tracking-[0.005em] text-white shadow-sm cursor-pointer disabled:opacity-60"
                style={{ background: '#EB001C' }}
              >
                {login.isPending ? 'Загрузка...' : 'Авторизироваться'}
              </button>
            </form>

            {/* Forgot password - positioned below the form */}
            <Link
              href="#"
              className="block mt-12 text-sm font-medium leading-[22px] tracking-[-0.01em] text-text-main"
            >
              Забыли пароль?
            </Link>
          </div>

          {/* Right: image */}
          <div className="absolute right-0 top-0 w-[551px] h-full flex flex-col justify-end items-center pb-10 overflow-hidden">
            <Image
              src="/images/auth-img.png"
              alt=""
              fill
              className="object-cover"
            />
            <div className="relative z-10">
              <Image
                src="/images/logo.svg"
                alt="ASKO"
                width={494}
                height={148}
                className="brightness-0 invert"
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
