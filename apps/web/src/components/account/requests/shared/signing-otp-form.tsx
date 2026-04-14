'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button, Input, FormField } from '@asko/ui';
import { repairRequestApi } from '@/lib/api/repair-request';

interface SigningOtpFormProps {
  requestId: string;
  channel: string;
  maskedTarget: string;
  initialRetryAfter: number;
  onSuccess: () => void;
  onError?: (msg: string) => void;
}

export function SigningOtpForm({ requestId, channel, maskedTarget, initialRetryAfter, onSuccess, onError }: SigningOtpFormProps) {
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(initialRetryAfter);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown(c => Math.max(0, c - 1)), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleVerify = useCallback(async () => {
    setVerifying(true);
    setError('');
    try {
      if (channel === 'password') {
        if (!password.trim()) { setError('Введите пароль'); setVerifying(false); return; }
        await repairRequestApi.verifyAvrSigning(requestId, { password });
      } else {
        if (!code.trim() || code.length < 6) { setError('Введите 6-значный код'); setVerifying(false); return; }
        await repairRequestApi.verifyAvrSigning(requestId, { code });
      }
      onSuccess();
    } catch {
      const msg = 'Неверный код или пароль';
      setError(msg);
      onError?.(msg);
    } finally {
      setVerifying(false);
    }
  }, [channel, code, password, requestId, onSuccess, onError]);

  const handleResend = useCallback(async () => {
    try {
      const { data } = await repairRequestApi.resendAvrOtp(requestId);
      setCooldown(data.retryAfter);
    } catch { /* */ }
  }, [requestId]);

  if (channel === 'password') {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-[13px] sm:text-sm text-text-sub">
          Для подписания акта введите пароль от вашей учётной записи
        </p>
        <FormField label="Пароль">
          <Input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Пароль..."
            onKeyDown={e => e.key === 'Enter' && handleVerify()}
          />
        </FormField>
        {error && <p className="text-sm text-brand-red">{error}</p>}
        <Button variant="primary" onClick={handleVerify} disabled={verifying || !password.trim()}>
          {verifying ? 'Проверка...' : 'Подписать'}
        </Button>
      </div>
    );
  }

  const channelLabel = channel === 'phone' ? 'телефон' : 'email';

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[13px] sm:text-sm text-text-sub">
        Код подтверждения отправлен на {channelLabel}: <span className="font-medium text-text-main">{maskedTarget}</span>
      </p>
      <FormField label="Код подтверждения">
        <Input
          type="text"
          inputMode="numeric"
          maxLength={6}
          value={code}
          onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
          placeholder="000000"
          onKeyDown={e => e.key === 'Enter' && handleVerify()}
          autoFocus
        />
      </FormField>
      {error && <p className="text-sm text-brand-red">{error}</p>}
      <div className="flex items-center gap-3 flex-wrap">
        <Button variant="primary" onClick={handleVerify} disabled={verifying || code.length < 6}>
          {verifying ? 'Проверка...' : 'Подписать'}
        </Button>
        {cooldown > 0 ? (
          <span className="text-xs text-text-sub">Повторно через {cooldown} сек.</span>
        ) : (
          <button type="button" onClick={handleResend} className="text-xs text-text-sub hover:text-brand-red cursor-pointer">
            Отправить повторно
          </button>
        )}
      </div>
    </div>
  );
}
