'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { authApi } from '@/lib/api/auth';
import { Input } from '@asko/ui';
import { Check, Minus } from 'lucide-react';

interface LoginMethodsSectionProps {
  providers: string[];
  email: string;
  emailVerified: boolean;
  phone: string;
  phoneVerified: boolean;
  onPhoneVerified?: () => void;
  onResendEmailConfirmation?: () => void;
  resendingEmail?: boolean;
  emailResendCooldown?: number;
  phoneChangePending?: boolean;
  onPhoneChangeConfirmed?: () => void;
}

export function LoginMethodsSection({
  providers,
  email,
  emailVerified,
  phone,
  phoneVerified,
  onPhoneVerified,
  onResendEmailConfirmation,
  resendingEmail,
  emailResendCooldown = 0,
  phoneChangePending,
  onPhoneChangeConfirmed,
}: LoginMethodsSectionProps) {
  // providers array = source of truth for active login methods
  const emailEnabled = providers.includes('EMAIL');   // can login with email+password
  const phoneEnabled = providers.includes('PHONE');   // can login with phone OTP
  const googleEnabled = providers.includes('GOOGLE');

  // contact exists but not yet an active login method (needs verification to unlock)
  const emailPending = !!email && !emailEnabled;
  const phonePending = !!phone && !phoneEnabled;

  // Phone verification OTP state
  const [phoneOtpStep, setPhoneOtpStep] = useState<'idle' | 'sent' | 'verifying'>('idle');
  const [phoneCode, setPhoneCode] = useState('');
  const [phoneCooldown, setPhoneCooldown] = useState(0);
  const [phoneSending, setPhoneSending] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [phoneSuccess, setPhoneSuccess] = useState<string | null>(null);
  const codeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (phoneCooldown <= 0) return;
    const timer = setInterval(() => setPhoneCooldown((v) => Math.max(0, v - 1)), 1000);
    return () => clearInterval(timer);
  }, [phoneCooldown]);

  const handleSendPhoneOtp = useCallback(async () => {
    if (phoneSending || phoneCooldown > 0) return;
    setPhoneSending(true);
    setPhoneError(null);
    try {
      const { data } = await authApi.sendPhoneVerification();
      setPhoneCooldown(data.retryAfter ?? 60);
      setPhoneOtpStep('sent');
      setTimeout(() => codeInputRef.current?.focus(), 100);
    } catch (err: any) {
      setPhoneError(err?.response?.data?.message ?? 'Не удалось отправить код');
    } finally {
      setPhoneSending(false);
    }
  }, [phoneSending, phoneCooldown]);

  // Auto-show OTP input when phone change is pending (OTP already sent by handleSave)
  useEffect(() => {
    if (phoneChangePending && phoneOtpStep === 'idle') {
      setPhoneOtpStep('sent');
      setPhoneCooldown(60);
      setTimeout(() => codeInputRef.current?.focus(), 100);
    }
  }, [phoneChangePending]);

  const handleConfirmPhone = useCallback(async () => {
    if (phoneCode.length !== 6) return;
    setPhoneOtpStep('verifying');
    setPhoneError(null);
    try {
      // Use the right API depending on whether this is verification or change
      const { data } = phoneChangePending
        ? await authApi.confirmPhoneChange(phoneCode)
        : await authApi.confirmPhoneVerification(phoneCode);
      setPhoneSuccess(data.message);
      setPhoneOtpStep('idle');
      setPhoneCode('');
      if (phoneChangePending) {
        onPhoneChangeConfirmed?.();
      } else {
        onPhoneVerified?.();
      }
    } catch (err: any) {
      setPhoneError(err?.response?.data?.message ?? 'Неверный код');
      setPhoneOtpStep('sent');
    }
  }, [phoneCode, phoneChangePending, onPhoneVerified, onPhoneChangeConfirmed]);

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-base font-medium text-text-main">Способы входа</h3>

      <div className="flex flex-col gap-1">
        {/* Email + Password */}
        <div className="flex items-center justify-between py-2.5">
          <div className="flex items-center gap-3">
            <MethodIcon active={emailEnabled} />
            <div>
              <p className="text-sm font-medium text-text-main">Email + Пароль</p>
              {email && <p className="text-xs text-text-sub">{email}</p>}
            </div>
          </div>
          {emailEnabled ? (
            <span className="text-xs text-green-600">Активен</span>
          ) : emailPending ? (
            <div className="flex items-center gap-3">
              <span className="text-xs text-amber-600">Требуется подтверждение</span>
              {onResendEmailConfirmation && (
                <button
                  type="button"
                  onClick={onResendEmailConfirmation}
                  disabled={resendingEmail || (emailResendCooldown ?? 0) > 0}
                  className="text-xs text-brand-red font-medium hover:underline disabled:opacity-50 disabled:no-underline cursor-pointer disabled:cursor-not-allowed"
                >
                  {(emailResendCooldown ?? 0) > 0
                    ? `Повторно (${emailResendCooldown}с)`
                    : resendingEmail
                      ? 'Отправка...'
                      : 'Подтвердить'}
                </button>
              )}
            </div>
          ) : (
            <span className="text-xs text-text-sub">Укажите email в профиле</span>
          )}
        </div>

        {/* Phone */}
        <div className="flex flex-col gap-2 py-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MethodIcon active={phoneEnabled} />
              <div>
                <p className="text-sm font-medium text-text-main">Телефон (СМС-код)</p>
                {phone && <p className="text-xs text-text-sub">{phone}</p>}
              </div>
            </div>
            {phoneEnabled ? (
              <span className="text-xs text-green-600">Активен</span>
            ) : phonePending ? (
              <div className="flex items-center gap-3">
                {phoneSuccess ? (
                  <span className="text-xs text-green-600">{phoneSuccess}</span>
                ) : (
                  <span className="text-xs text-amber-600">Требуется подтверждение</span>
                )}
                {phoneOtpStep === 'idle' && !phoneSuccess && (
                  <button
                    type="button"
                    onClick={handleSendPhoneOtp}
                    disabled={phoneSending}
                    className="text-xs text-brand-red font-medium hover:underline disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                  >
                    {phoneSending ? 'Отправка...' : 'Подтвердить'}
                  </button>
                )}
              </div>
            ) : (
              <span className="text-xs text-text-sub">Укажите телефон в профиле</span>
            )}
          </div>

          {/* Phone OTP input — only show when phone is pending (not yet a provider) */}
          {phoneOtpStep !== 'idle' && !phoneEnabled && (
            <div className="flex flex-col gap-2 ml-11">
              <div className="flex items-center gap-2">
                <Input
                  ref={codeInputRef}
                  value={phoneCode}
                  onChange={(e) => setPhoneCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  className="w-32 text-center tracking-[0.3em] font-mono"
                />
                <button
                  type="button"
                  onClick={handleConfirmPhone}
                  disabled={phoneCode.length !== 6 || phoneOtpStep === 'verifying'}
                  className="text-xs text-white font-medium px-3 py-2 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                  style={{ background: '#EB001C' }}
                >
                  {phoneOtpStep === 'verifying' ? 'Проверка...' : 'Подтвердить'}
                </button>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleSendPhoneOtp}
                  disabled={phoneSending || phoneCooldown > 0}
                  className="text-xs text-text-sub hover:text-text-main disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                >
                  {phoneCooldown > 0
                    ? `Отправить повторно (${phoneCooldown}с)`
                    : 'Отправить повторно'}
                </button>
                <button
                  type="button"
                  onClick={() => { setPhoneOtpStep('idle'); setPhoneCode(''); setPhoneError(null); }}
                  className="text-xs text-text-sub hover:text-text-main cursor-pointer"
                >
                  Отмена
                </button>
              </div>
              {phoneError && (
                <p className="text-xs text-brand-red">{phoneError}</p>
              )}
            </div>
          )}
        </div>

        {/* Google */}
        <div className="flex items-center justify-between py-2.5">
          <div className="flex items-center gap-3">
            <MethodIcon active={googleEnabled} />
            <p className="text-sm font-medium text-text-main">Google</p>
          </div>
          <span className={`text-xs ${googleEnabled ? 'text-green-600' : 'text-text-sub'}`}>
            {googleEnabled ? 'Подключён' : 'Не подключён'}
          </span>
        </div>
      </div>
    </div>
  );
}

function MethodIcon({ active }: { active: boolean }) {
  if (active) {
    return (
      <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center shrink-0">
        <Check className="w-4 h-4 text-green-600" strokeWidth={2} />
      </div>
    );
  }
  return (
    <div className="w-8 h-8 rounded-full bg-[#F0F0F1] flex items-center justify-center shrink-0">
      <Minus className="w-4 h-4 text-text-sub" strokeWidth={2} />
    </div>
  );
}

