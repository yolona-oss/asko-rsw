'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Image from 'next/image';
import { LandingHeader } from '@/components/landing/header';
import { useSignup } from '@/lib/api/use-auth';
import { EmailInput, PasswordInput, PhoneInput, Input, NameInput } from '@asko/ui';
import {
  MIN_USER_PASSWORD_LENGTH,
  MAX_USER_PASSWORD_LENGTH,
  NAME_REGEX,
} from '@asko/shared/client';

const NAMES_D = ['Иван', 'Петр', 'Александр', 'Дмитрий'];

const SURNAMES_D = ['Иванов', 'Петров', 'Сидоров', 'Кузнецов'];

const PATRONYMICS_D = [
  'Иванович',
  'Петрович',
  'Александрович',
];

function RegisterForm() {
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get('invite');
  const prefillEmail = searchParams.get('email') ?? '';
  const accountType = inviteToken ? 'сотрудника' : '';

  const [firstName, setFirstName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState(prefillEmail);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [confirmTouched, setConfirmTouched] = useState(false);

  const [nameError, setNameError] = useState('');
  const [phoneError, setPhoneError] = useState('');

  const passwordsMatch = password === confirmPassword;
  const showConfirmError = confirmTouched && confirmPassword.length > 0 && !passwordsMatch;

  const signup = useSignup();

  function validateName(value: string) {
    if (value && !NAME_REGEX.test(value)) {
      setNameError('Допустимы только буквы, цифры, пробелы, дефисы и точки');
    } else {
      setNameError('');
    }
  }

  function validatePhone(digits: string) {
    if (digits && digits.length > 1 && digits.length < 11) {
      setPhoneError('Введите полный номер телефона');
    } else {
      setPhoneError('');
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) return;

    if (!passwordsMatch) {
      setConfirmTouched(true);
      return;
    }

    // Validate phone before submit
    const phoneDigits = phone.replace(/\D/g, '');
    if (phoneDigits && phoneDigits.length < 11) {
      setPhoneError('Введите полный номер телефона');
      return;
    }

    signup.mutate({
      email,
      password,
      firstName,
      phone: phoneDigits || undefined,
      inviteToken: inviteToken ?? undefined,
    });
  }

  const errorMessage = signup.error
    ? (signup.error as any)?.response?.data?.message ?? 'Ошибка регистрации'
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
              {inviteToken && (
                <p className="text-sm text-[#A6A6A6] tracking-[-0.01em]">
                  Вы приглашены по ссылке сотрудника
                </p>
              )}

              {errorMessage && (
                <div className="px-3 py-2 text-sm text-white bg-red-600/80">{errorMessage}</div>
              )}

              {/* ФИО */}
              <div className="flex flex-col gap-2">
                <label className="text-2xl font-medium leading-7 tracking-[-0.01em] text-[#F1F1F1]">
                  ФИО
                </label>
                <NameInput
                  type="text"
                  names={NAMES_D}
                  surnames={SURNAMES_D}
                  patronymics={PATRONYMICS_D}
                  value={firstName}
                  onChange={(e) => {
                    setFirstName(e.target.value);
                    validateName(e.target.value);
                  }}
                  onBlur={() => validateName(firstName)}
                  placeholder="Введите ФИО"
                  error={!!nameError}
                />
                {nameError && <p className="text-xs text-brand-red">{nameError}</p>}
              </div>

              {/* Номер телефона */}
              <div className="flex flex-col gap-2">
                <label className="text-2xl font-medium leading-7 tracking-[-0.01em] text-[#F1F1F1]">
                  Номер телефона
                </label>
                <PhoneInput
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  onValueChange={(digits) => validatePhone(digits)}
                  error={!!phoneError}
                />
                {phoneError && <p className="text-xs text-brand-red">{phoneError}</p>}
              </div>

              {/* Email */}
              <div className="flex flex-col gap-2">
                <label className="text-2xl font-medium leading-7 tracking-[-0.01em] text-[#F1F1F1]">
                  Email
                </label>
                <EmailInput
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  required
                />
              </div>

              {/* Пароль */}
              <div className="flex flex-col gap-2">
                <label className="text-2xl font-medium leading-7 tracking-[-0.01em] text-[#F1F1F1]">
                  Пароль
                </label>
                <PasswordInput
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Придумайте пароль"
                  minLength={MIN_USER_PASSWORD_LENGTH}
                  maxLength={MAX_USER_PASSWORD_LENGTH}
                  required
                />
              </div>

              {/* Повторите пароль */}
              {password.length > 0 && (
                <div className="flex flex-col gap-2">
                  <label className="text-2xl font-medium leading-7 tracking-[-0.01em] text-[#F1F1F1]">
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

              {/* Button */}
              <button
                type="submit"
                disabled={signup.isPending || (password.length > 0 && !passwordsMatch)}
                className="flex items-center justify-center w-full h-10 text-sm font-medium tracking-[0.005em] text-white shadow-sm disabled:opacity-60"
                style={{ background: '#EB001C' }}
              >
                {signup.isPending ? 'Загрузка...' : 'Далее'}
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
          </form>
        </div>
      </div>

      {/* Desktop layout */}
      <div className="hidden lg:flex items-center justify-center min-h-screen bg-page-bg">
        <div className="relative w-[1120px] h-[676px] bg-white">
          {/* Left: form */}
          <div className="absolute left-6 top-1/2 -translate-y-1/2 w-[446px]">
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              {inviteToken && (
                <p className="text-sm text-[#A6A6A6] tracking-[-0.01em]">
                  Регистрация аккаунта {accountType}
                </p>
              )}

              {errorMessage && (
                <div className="px-3 py-2 text-sm text-white bg-red-600">{errorMessage}</div>
              )}

              <div className="flex flex-col gap-8">
                {/* ФИО */}
                <div className="flex flex-col gap-2">
                  <label className="text-2xl font-medium leading-7 tracking-[-0.01em] text-text-main">
                    ФИО
                  </label>
                  <NameInput
                    type="text"
                    value={firstName}
                    names={NAMES_D}
                    surnames={SURNAMES_D}
                    patronymics={PATRONYMICS_D}
                    onChange={(e) => {
                      setFirstName(e.target.value);
                      validateName(e.target.value);
                    }}
                    onBlur={() => validateName(firstName)}
                    placeholder="Введите ФИО"
                    error={!!nameError}
                  />
                  {nameError && <p className="text-xs text-brand-red">{nameError}</p>}
                </div>

                {/* Номер телефона */}
                <div className="flex flex-col gap-2">
                  <label className="text-2xl font-medium leading-7 tracking-[-0.01em] text-text-main">
                    Номер телефона
                  </label>
                  <PhoneInput
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    onValueChange={(digits) => validatePhone(digits)}
                    error={!!phoneError}
                  />
                  {phoneError && <p className="text-xs text-brand-red">{phoneError}</p>}
                </div>

                {/* Email */}
                <div className="flex flex-col gap-2">
                  <label className="text-2xl font-medium leading-7 tracking-[-0.01em] text-text-main">
                    Email
                  </label>
                  <EmailInput
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@email.com"
                    required
                  />
                </div>

                {/* Пароль */}
                <div className="flex flex-col gap-2">
                  <label className="text-2xl font-medium leading-7 tracking-[-0.01em] text-text-main">
                    Пароль
                  </label>
                  <PasswordInput
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Придумайте пароль"
                    minLength={MIN_USER_PASSWORD_LENGTH}
                    maxLength={MAX_USER_PASSWORD_LENGTH}
                    required
                  />
                </div>

                {/* Повторите пароль */}
                {password.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <label className="text-2xl font-medium leading-7 tracking-[-0.01em] text-text-main">
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

              {/* Button */}
              <button
                type="submit"
                disabled={signup.isPending || (password.length > 0 && !passwordsMatch)}
                className="flex items-center justify-center w-fit px-6 h-10 text-sm font-medium tracking-[0.005em] text-white shadow-sm disabled:opacity-60"
                style={{ background: '#EB001C' }}
              >
                {signup.isPending ? 'Загрузка...' : 'Далее'}
              </button>
            </form>
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
