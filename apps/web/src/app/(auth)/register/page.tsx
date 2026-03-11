'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Image from 'next/image';
import { LandingHeader } from '@/components/landing/header';

function RegisterForm() {
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get('invite');
  const accountType = "unkown"

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
          <div className="relative z-10 flex flex-col flex-1 px-4 pt-8 pb-10">
            <div className="flex flex-col gap-6 flex-1">
              {inviteToken && (
                <p className="text-sm text-[#A6A6A6] tracking-[-0.01em]">
                  Вы приглашены по ссылке сотрудника
                </p>
              )}

              {/* ФИО */}
              <div className="flex flex-col gap-2">
                <label className="text-2xl font-medium leading-7 tracking-[-0.01em] text-[#F1F1F1]">
                  ФИО
                </label>
                <input
                  type="text"
                  placeholder="Введите ФИО"
                  className="w-full h-9 px-3 text-sm bg-white border border-[#E2E8F0] text-[#737373] placeholder:text-[#B5B7C0] outline-none"
                />
              </div>

              {/* Номер телефона */}
              <div className="flex flex-col gap-2">
                <label className="text-2xl font-medium leading-7 tracking-[-0.01em] text-[#F1F1F1]">
                  Номер телефона
                </label>
                <input
                  type="tel"
                  placeholder="+7 (___) ___-__-__"
                  className="w-full h-9 px-3 text-sm bg-white border border-[#E2E8F0] text-[#737373] placeholder:text-[#B5B7C0] outline-none"
                />
              </div>

              {/* Email */}
              <div className="flex flex-col gap-2">
                <label className="text-2xl font-medium leading-7 tracking-[-0.01em] text-[#F1F1F1]">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="you@email.com"
                  className="w-full h-9 px-3 text-sm bg-white border border-[#E2E8F0] text-[#737373] placeholder:text-[#B5B7C0] outline-none"
                />
              </div>

              {/* Адрес установки техники */}
              <div className="flex flex-col gap-2">
                <label className="text-2xl font-medium leading-7 tracking-[-0.01em] text-[#F1F1F1]">
                  Адрес установки техники
                </label>
                <input
                  type="text"
                  placeholder="Введите адрес"
                  className="w-full h-9 px-3 text-sm bg-white border border-[#E2E8F0] text-[#737373] placeholder:text-[#B5B7C0] outline-none"
                />
              </div>

              {/* Button */}
              <button
                type="button"
                className="flex items-center justify-center w-full h-10 text-sm font-medium tracking-[0.005em] text-white shadow-sm"
                style={{ background: '#EB001C' }}
              >
                Далее
              </button>
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
          </div>
        </div>
      </div>

      {/* Desktop layout */}
      <div className="hidden lg:flex items-center justify-center min-h-screen bg-page-bg">
        <div className="relative w-[1120px] h-[676px] bg-white">
          {/* Left: form */}
          <div className="absolute left-6 top-1/2 -translate-y-1/2 w-[446px]">
            <div className="flex flex-col gap-6">
              {inviteToken && (
                <p className="text-sm text-[#A6A6A6] tracking-[-0.01em]">
                  Регистрация аккаунта {accountType}
                </p>
              )}

              <div className="flex flex-col gap-8">
                {/* ФИО */}
                <div className="flex flex-col gap-2">
                  <label className="text-2xl font-medium leading-7 tracking-[-0.01em] text-text-main">
                    ФИО
                  </label>
                  <input
                    type="text"
                    placeholder="Введите ФИО"
                    className="w-full h-9 px-3 text-sm bg-white border border-[#E2E8F0] text-[#737373] placeholder:text-[#B5B7C0] outline-none"
                  />
                </div>

                {/* Номер телефона */}
                <div className="flex flex-col gap-2">
                  <label className="text-2xl font-medium leading-7 tracking-[-0.01em] text-text-main">
                    Номер телефона
                  </label>
                  <input
                    type="tel"
                    placeholder="+7 (___) ___-__-__"
                    className="w-full h-9 px-3 text-sm bg-white border border-[#E2E8F0] text-[#737373] placeholder:text-[#B5B7C0] outline-none"
                  />
                </div>

                {/* Email */}
                <div className="flex flex-col gap-2">
                  <label className="text-2xl font-medium leading-7 tracking-[-0.01em] text-text-main">
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="you@email.com"
                    className="w-full h-9 px-3 text-sm bg-white border border-[#E2E8F0] text-[#737373] placeholder:text-[#737373] outline-none"
                  />
                </div>

                {/* Адрес установки техники */}
                <div className="flex flex-col gap-2">
                  <label className="text-2xl font-medium leading-7 tracking-[-0.01em] text-text-main">
                    Адрес установки техники
                  </label>
                  <input
                    type="text"
                    placeholder="Введите адрес"
                    className="w-full h-9 px-3 text-sm bg-white border border-[#E2E8F0] text-[#737373] placeholder:text-[#737373] outline-none"
                  />
                </div>
              </div>

              {/* Button */}
              <button
                type="button"
                className="flex items-center justify-center w-fit px-6 h-10 text-sm font-medium tracking-[0.005em] text-white shadow-sm"
                style={{ background: '#EB001C' }}
              >
                Далее
              </button>
            </div>
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

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
