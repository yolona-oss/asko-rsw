'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Input } from '@asko/ui';

interface MfaOtpFormProps {
  onSubmit: (code: string, trustDevice: boolean) => void;
  onResend: () => Promise<{ retryAfter: number }>;
  onBack?: () => void;
  isPending?: boolean;
  error?: string | null;
  showTrustDevice?: boolean;
  /** Label color variant */
  variant?: 'mobile' | 'desktop';
}

export function MfaOtpForm({
  onSubmit,
  onResend,
  onBack,
  isPending,
  error,
  showTrustDevice = true,
  variant = 'desktop',
}: MfaOtpFormProps) {
  const [code, setCode] = useState('');
  const [trustDevice, setTrustDevice] = useState(false);
  const [cooldown, setCooldown] = useState(60);
  const [resending, setResending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((v) => Math.max(0, v - 1)), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (code.length !== 6 || isPending) return;
      onSubmit(code, trustDevice);
    },
    [code, trustDevice, isPending, onSubmit],
  );

  const handleResend = useCallback(async () => {
    if (resending || cooldown > 0) return;
    setResending(true);
    try {
      const result = await onResend();
      setCooldown(result.retryAfter ?? 60);
    } finally {
      setResending(false);
    }
  }, [resending, cooldown, onResend]);

  const handleCodeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
    setCode(val);
  }, []);

  const labelColor = variant === 'mobile' ? 'text-[#F1F1F1]' : 'text-text-main';
  const subColor = variant === 'mobile' ? 'text-[#A6A6A6]' : 'text-text-sub';

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {error && (
        <div className={`px-3 py-2 text-sm text-white ${variant === 'mobile' ? 'bg-red-600/80' : 'bg-red-600'}`}>
          {error}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <p className={`text-2xl font-medium leading-7 tracking-[-0.01em] ${labelColor}`}>
          Код подтверждения
        </p>
        <p className={`text-sm ${subColor}`}>
          Введите 6-значный код, отправленный на ваш email
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Input
          ref={inputRef}
          value={code}
          onChange={handleCodeChange}
          placeholder="000000"
          maxLength={6}
          inputMode="numeric"
          autoComplete="one-time-code"
          className="text-center text-2xl tracking-[0.5em] font-mono"
        />
      </div>

      {showTrustDevice && (
        <label className={`flex items-center gap-2 cursor-pointer ${subColor}`}>
          <input
            type="checkbox"
            checked={trustDevice}
            onChange={(e) => setTrustDevice(e.target.checked)}
            className="w-4 h-4 accent-[#EB001C]"
          />
          <span className="text-sm">Запомнить устройство на 30 дней</span>
        </label>
      )}

      <button
        type="submit"
        disabled={code.length !== 6 || isPending}
        className="flex items-center justify-center w-full lg:w-fit px-6 h-10 text-sm font-medium tracking-[0.005em] text-white shadow-sm cursor-pointer disabled:opacity-60"
        style={{ background: '#EB001C' }}
      >
        {isPending ? 'Проверка...' : 'Подтвердить'}
      </button>

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={handleResend}
          disabled={resending || cooldown > 0}
          className={`text-sm font-medium ${labelColor} disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed`}
        >
          {cooldown > 0
            ? `Отправить повторно (${cooldown}с)`
            : resending
              ? 'Отправка...'
              : 'Отправить код повторно'}
        </button>

        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className={`text-sm font-medium ${labelColor} cursor-pointer`}
          >
            Назад
          </button>
        )}
      </div>
    </form>
  );
}
