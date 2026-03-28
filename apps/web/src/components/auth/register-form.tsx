'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSignup } from '@/lib/api/use-auth';
import { EmailInput, PasswordInput, PhoneInput, NameInput, Input } from '@asko/ui';
import {
  MIN_USER_PASSWORD_LENGTH,
  MAX_USER_PASSWORD_LENGTH,
  NAME_REGEX,
} from '@asko/shared/client';

const NAMES_D = ['Иван', 'Петр', 'Александр', 'Дмитрий'];
const SURNAMES_D = ['Иванов', 'Петров', 'Сидоров', 'Кузнецов'];
const PATRONYMICS_D = ['Иванович', 'Петрович', 'Александрович'];

type AuthMethod = 'email' | 'phone';
type Step = 'credentials' | 'verification';

interface RegisterFormProps {
  variant: 'mobile' | 'desktop';
  inviteToken?: string | null;
  prefillEmail?: string;
}

export function RegisterForm({ variant, inviteToken, prefillEmail = '' }: RegisterFormProps) {
  const router = useRouter();
  const [step, setStep] = useState<Step>('credentials');
  const [authMethod, setAuthMethod] = useState<AuthMethod>('email');

  // Shared
  const [firstName, setFirstName] = useState('');
  const [nameError, setNameError] = useState('');

  // Email method
  const [email, setEmail] = useState(prefillEmail);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [confirmTouched, setConfirmTouched] = useState(false);

  // Phone method
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');

  const passwordsMatch = password === confirmPassword;
  const showConfirmError = confirmTouched && confirmPassword.length > 0 && !passwordsMatch;

  const signup = useSignup({ onSuccess: () => setStep('verification') });

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

  function handleAuthMethodChange(method: AuthMethod) {
    setAuthMethod(method);
    if (signup.error) signup.reset();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (authMethod === 'email') {
      if (!email || !password) return;
      if (!passwordsMatch) {
        setConfirmTouched(true);
        return;
      }
      signup.mutate({
        email,
        password,
        firstName,
        inviteToken: inviteToken ?? undefined,
      });
    } else {
      const phoneDigits = phone.replace(/\D/g, '');
      if (!phoneDigits || phoneDigits.length < 11) {
        setPhoneError('Введите полный номер телефона');
        return;
      }
      // TODO: Call phone OTP API when backend is ready
      setStep('verification');
    }
  }

  const errorMessage = signup.error
    ? (signup.error as any)?.response?.data?.message ?? 'Ошибка регистрации'
    : null;

  const labelColor = variant === 'mobile' ? 'text-[#F1F1F1]' : 'text-text-main';
  const subColor = variant === 'mobile' ? 'text-[#A6A6A6]' : 'text-text-sub';
  const errorBg = variant === 'mobile' ? 'bg-red-600/80' : 'bg-red-600';

  // ─── Step 2: Verification ──────────────────────────────────────────

  if (step === 'verification') {
    if (authMethod === 'email') {
      return (
        <div className="flex flex-col gap-6">
          <p className={`text-2xl font-medium leading-7 tracking-[-0.01em] ${labelColor}`}>
            Подтвердите email
          </p>
          <p className={`text-sm ${subColor}`}>
            Мы отправили письмо с подтверждением на <strong>{email}</strong>.
            Перейдите по ссылке в письме для завершения регистрации.
          </p>
          <button
            type="button"
            onClick={() => router.push('/account')}
            className={`flex items-center justify-center ${variant === 'mobile' ? 'w-full' : 'w-fit'} px-6 h-10 text-sm font-medium tracking-[0.005em] text-white shadow-sm cursor-pointer`}
            style={{ background: '#EB001C' }}
          >
            Перейти в аккаунт
          </button>
        </div>
      );
    }

    return (
      <PhoneOtpStep
        phone={phone}
        variant={variant}
        onBack={() => setStep('credentials')}
      />
    );
  }

  // ─── Step 1: Credentials ──────────────────────────────────────────

  const activeTabCls = 'bg-[#EB001C] text-white';
  const inactiveTabCls = variant === 'mobile'
    ? 'bg-white/10 text-white/60'
    : 'bg-[#F0F0F1] text-text-sub';

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {inviteToken && (
        <p className="text-sm text-[#A6A6A6] tracking-[-0.01em]">
          {variant === 'mobile'
            ? 'Вы приглашены по ссылке сотрудника'
            : 'Регистрация аккаунта сотрудника'}
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

        {/* Auth method toggle */}
        <div className="flex flex-col gap-2">
          <label className={`text-2xl font-medium leading-7 tracking-[-0.01em] ${labelColor}`}>
            Способ регистрации
          </label>
          <div className="flex">
            <button
              type="button"
              onClick={() => handleAuthMethodChange('email')}
              className={`flex-1 h-10 text-sm font-medium transition-colors ${authMethod === 'email' ? activeTabCls : inactiveTabCls}`}
            >
              Email
            </button>
            <button
              type="button"
              onClick={() => handleAuthMethodChange('phone')}
              className={`flex-1 h-10 text-sm font-medium transition-colors ${authMethod === 'phone' ? activeTabCls : inactiveTabCls}`}
            >
              Телефон
            </button>
          </div>
        </div>

        {/* Conditional fields */}
        {authMethod === 'email' ? (
          <>
            <div className="flex flex-col gap-2">
              <label className={`text-2xl font-medium leading-7 tracking-[-0.01em] ${labelColor}`}>Email</label>
              <EmailInput
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                required
              />
            </div>

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
          </>
        ) : (
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
        )}
      </div>

      <button
        type="submit"
        disabled={signup.isPending || (authMethod === 'email' && password.length > 0 && !passwordsMatch)}
        className={`flex items-center justify-center ${variant === 'mobile' ? 'w-full' : 'w-fit px-6'} h-10 text-sm font-medium tracking-[0.005em] text-white shadow-sm disabled:opacity-60`}
        style={{ background: '#EB001C' }}
      >
        {signup.isPending ? 'Загрузка...' : 'Далее'}
      </button>
    </form>
  );
}

// ─── Phone OTP placeholder (backend not implemented) ─────────────

function PhoneOtpStep({
  phone,
  variant,
  onBack,
}: {
  phone: string;
  variant: 'mobile' | 'desktop';
  onBack: () => void;
}) {
  const [code, setCode] = useState('');
  const [cooldown, setCooldown] = useState(60);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((v) => Math.max(0, v - 1)), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const labelColor = variant === 'mobile' ? 'text-[#F1F1F1]' : 'text-text-main';
  const subColor = variant === 'mobile' ? 'text-[#A6A6A6]' : 'text-text-sub';

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <p className={`text-2xl font-medium leading-7 tracking-[-0.01em] ${labelColor}`}>
          Подтверждение телефона
        </p>
        <p className={`text-sm ${subColor}`}>
          Введите 6-значный код, отправленный на {phone}
        </p>
      </div>

      <Input
        ref={inputRef}
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
        placeholder="000000"
        maxLength={6}
        inputMode="numeric"
        autoComplete="one-time-code"
        className="text-center text-2xl tracking-[0.5em] font-mono"
      />

      <button
        type="button"
        disabled
        className={`flex items-center justify-center ${variant === 'mobile' ? 'w-full' : 'w-fit'} px-6 h-10 text-sm font-medium tracking-[0.005em] text-white shadow-sm cursor-pointer disabled:opacity-60`}
        style={{ background: '#EB001C' }}
      >
        Подтвердить
      </button>

      <div className="flex items-center gap-4">
        <button
          type="button"
          disabled={cooldown > 0}
          className={`text-sm font-medium ${labelColor} disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed`}
        >
          {cooldown > 0
            ? `Отправить повторно (${cooldown}с)`
            : 'Отправить код повторно'}
        </button>

        <button
          type="button"
          onClick={onBack}
          className={`text-sm font-medium ${labelColor} cursor-pointer`}
        >
          Назад
        </button>
      </div>
    </div>
  );
}
