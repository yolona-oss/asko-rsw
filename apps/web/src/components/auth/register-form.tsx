'use client';

import { useState } from 'react';
import { useSignup } from '@/lib/api/use-auth';
import { EmailInput, PasswordInput, PhoneInput, NameInput } from '@asko/ui';
import {
  MIN_USER_PASSWORD_LENGTH,
  MAX_USER_PASSWORD_LENGTH,
  NAME_REGEX,
} from '@asko/shared/client';

const NAMES_D = ['Иван', 'Петр', 'Александр', 'Дмитрий'];
const SURNAMES_D = ['Иванов', 'Петров', 'Сидоров', 'Кузнецов'];
const PATRONYMICS_D = ['Иванович', 'Петрович', 'Александрович'];

interface RegisterFormProps {
  variant: 'mobile' | 'desktop';
  inviteToken?: string | null;
  prefillEmail?: string;
}

export function RegisterForm({ variant, inviteToken, prefillEmail = '' }: RegisterFormProps) {
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

  const labelColor = variant === 'mobile' ? 'text-[#F1F1F1]' : 'text-text-main';
  const errorBg = variant === 'mobile' ? 'bg-red-600/80' : 'bg-red-600';

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {inviteToken && (
        <p className="text-sm text-[#A6A6A6] tracking-[-0.01em]">
          {variant === 'mobile'
            ? 'Вы приглашены по ссылке сотрудника'
            : `Регистрация аккаунта ${accountType}`}
        </p>
      )}

      {errorMessage && (
        <div className={`px-3 py-2 text-sm text-white ${errorBg}`}>{errorMessage}</div>
      )}

      <div className={`flex flex-col ${variant === 'desktop' ? 'gap-8' : 'gap-6'}`}>
        {/* ФИО */}
        <div className="flex flex-col gap-2">
          <label className={`text-2xl font-medium leading-7 tracking-[-0.01em] ${labelColor}`}>ФИО</label>
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
          <label className={`text-2xl font-medium leading-7 tracking-[-0.01em] ${labelColor}`}>Номер телефона</label>
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
          <label className={`text-2xl font-medium leading-7 tracking-[-0.01em] ${labelColor}`}>Email</label>
          <EmailInput
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            required
          />
        </div>

        {/* Пароль */}
        <div className="flex flex-col gap-2">
          <label className={`text-2xl font-medium leading-7 tracking-[-0.01em] ${labelColor}`}>Пароль</label>
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
            <label className={`text-2xl font-medium leading-7 tracking-[-0.01em] ${labelColor}`}>Повторите пароль</label>
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
        disabled={signup.isPending || (password.length > 0 && !passwordsMatch)}
        className={`flex items-center justify-center ${variant === 'mobile' ? 'w-full' : 'w-fit px-6'} h-10 text-sm font-medium tracking-[0.005em] text-white shadow-sm disabled:opacity-60`}
        style={{ background: '#EB001C' }}
      >
        {signup.isPending ? 'Загрузка...' : 'Далее'}
      </button>
    </form>
  );
}
