'use client';

import { useState, useEffect } from 'react';
import { authApi } from '@/lib/api/auth';
import { Button, Input, Toggle } from '@asko/ui';
import type { StatusMessage } from './types';

interface MfaSectionProps {
  emailVerified: boolean;
}

export function MfaSection({ emailVerified }: MfaSectionProps) {
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [mfaLoading, setMfaLoading] = useState(false);
  const [mfaOtpStep, setMfaOtpStep] = useState<'enable' | 'disable' | null>(null);
  const [mfaOtpCode, setMfaOtpCode] = useState('');
  const [mfaMessage, setMfaMessage] = useState<StatusMessage>(null);
  const [mfaCooldown, setMfaCooldown] = useState(0);
  const [initialLoaded, setInitialLoaded] = useState(false);

  // Load MFA status once
  useEffect(() => {
    if (initialLoaded) return;
    setInitialLoaded(true);
    authApi.getMfaStatus().then(({ data }) => {
      setMfaEnabled(data.enabled);
    }).catch(() => {});
  }, [initialLoaded]);

  // MFA cooldown timer
  useEffect(() => {
    if (mfaCooldown <= 0) return;
    const timer = setInterval(() => setMfaCooldown((v) => Math.max(0, v - 1)), 1000);
    return () => clearInterval(timer);
  }, [mfaCooldown]);

  const handleMfaToggle = async (enabled: boolean) => {
    setMfaMessage(null);
    setMfaLoading(true);
    try {
      if (enabled) {
        const { data } = await authApi.enableMfa();
        setMfaCooldown(data.retryAfter ?? 60);
        setMfaOtpStep('enable');
        setMfaOtpCode('');
      } else {
        const { data } = await authApi.initiateDisableMfa();
        setMfaCooldown(data.retryAfter ?? 60);
        setMfaOtpStep('disable');
        setMfaOtpCode('');
      }
    } catch (err: any) {
      setMfaMessage({ type: 'error', text: err?.response?.data?.message ?? 'Ошибка' });
    } finally {
      setMfaLoading(false);
    }
  };

  const handleMfaOtpSubmit = async () => {
    if (!mfaOtpCode || mfaOtpCode.length !== 6) return;
    setMfaLoading(true);
    setMfaMessage(null);
    try {
      if (mfaOtpStep === 'enable') {
        await authApi.verifyEnableMfa(mfaOtpCode);
        setMfaEnabled(true);
        setMfaMessage({ type: 'success', text: 'MFA включена' });
      } else {
        await authApi.confirmDisableMfa(mfaOtpCode);
        setMfaEnabled(false);
        setMfaMessage({ type: 'success', text: 'MFA отключена' });
      }
      setMfaOtpStep(null);
      setMfaOtpCode('');
    } catch (err: any) {
      setMfaMessage({ type: 'error', text: err?.response?.data?.message ?? 'Неверный код' });
    } finally {
      setMfaLoading(false);
      setTimeout(() => setMfaMessage(null), 5000);
    }
  };

  const handleMfaResend = async () => {
    if (mfaCooldown > 0) return;
    try {
      if (mfaOtpStep === 'enable') {
        const { data } = await authApi.enableMfa();
        setMfaCooldown(data.retryAfter ?? 60);
      } else {
        const { data } = await authApi.initiateDisableMfa();
        setMfaCooldown(data.retryAfter ?? 60);
      }
    } catch {}
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm font-medium text-text-main">Двухфакторная аутентификация</p>
      {emailVerified ? (
        <>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-text-main">Email OTP</p>
              <p className="text-xs text-text-sub/60 mt-0.5">
                При входе с нового устройства потребуется ввести код из email
              </p>
            </div>
            <Toggle
              checked={mfaEnabled}
              onChange={mfaLoading || mfaOtpStep !== null ? () => {} : handleMfaToggle}
            />
          </div>

          {mfaOtpStep && (
            <div className="flex flex-col gap-3 p-4 border border-border-light">
              <p className="text-sm text-text-main">
                {mfaOtpStep === 'enable' ? 'Введите код для включения MFA' : 'Введите код для отключения MFA'}
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Input
                  value={mfaOtpCode}
                  onChange={(e) => setMfaOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  inputMode="numeric"
                  className="w-full sm:w-40 text-center tracking-[0.3em] font-mono"
                />
                <Button
                  onClick={handleMfaOtpSubmit}
                  disabled={mfaOtpCode.length !== 6 || mfaLoading}
                  size="lg"
                >
                  {mfaLoading ? 'Проверка...' : 'Подтвердить'}
                </Button>
                <Button
                  onClick={() => { setMfaOtpStep(null); setMfaOtpCode(''); }}
                  variant="secondary"
                  size="lg"
                >
                  Отмена
                </Button>
              </div>
              <button
                type="button"
                onClick={handleMfaResend}
                disabled={mfaCooldown > 0}
                className="text-xs text-brand-red font-medium hover:underline disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed w-fit"
              >
                {mfaCooldown > 0 ? `Отправить повторно (${mfaCooldown}с)` : 'Отправить код повторно'}
              </button>
            </div>
          )}

          {mfaMessage && (
            <p className={`text-sm ${mfaMessage.type === 'success' ? 'text-success' : 'text-brand-red'}`}>
              {mfaMessage.text}
            </p>
          )}
        </>
      ) : (
        <p className="text-xs text-text-sub/60">
          Для включения двухфакторной аутентификации необходимо подтвердить email
        </p>
      )}
    </div>
  );
}
