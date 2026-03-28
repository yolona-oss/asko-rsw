'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAccount } from '../account-provider';
import { useAuth } from '@/lib/api/use-auth';
import { usersApi } from '@/lib/api/users';
import { authApi } from '@/lib/api/auth';
import { AvatarCropModal } from '../avatar-crop-modal';
import { Button, Input, FormField, PhoneInput } from '@asko/ui';
import type { StatusMessage } from './types';
import { ProfileFormSkeleton } from './profile-form-skeleton';
import { AvatarSection } from './avatar-section';
import { ChatPreferencesSection } from './chat-preferences-section';
import { MfaSection } from './mfa-section';
import { LoginMethodsSection } from './login-methods-section';
import { PasswordSection } from './password-section';

export function ProfileForm() {
  const { user } = useAccount();
  const { user: authUser } = useAuth();
  const queryClient = useQueryClient();

  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loaded, setLoaded] = useState(false);

  // Providers & verification
  const [providers, setProviders] = useState<string[]>([]);
  const [phoneVerified, setPhoneVerified] = useState(false);

  // Original values for change detection
  const originalEmail = useRef('');
  const originalEmailVerified = useRef(false);
  const originalPhone = useRef('');
  const originalPhoneVerified = useRef(false);

  // Phone change OTP
  const [phoneChangePending, setPhoneChangePending] = useState(false);
  const [emailVerified, setEmailVerified] = useState(true);
  const [resendingEmail, setResendingEmail] = useState(false);
  const [emailResendCooldown, setEmailResendCooldown] = useState(0);
  const [emailResendMessage, setEmailResendMessage] = useState<StatusMessage>(null);

  // Chat preferences
  const [chatAcceptConversations, setChatAcceptConversations] = useState(false);
  const [chatSearchable, setChatSearchable] = useState(false);

  // Avatar state
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  // Submission state
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [message, setMessage] = useState<StatusMessage>(null);

  // Load profile data once
  const profileLoaded = useRef(false);
  if (!profileLoaded.current && authUser) {
    profileLoaded.current = true;
    Promise.all([
      usersApi.getProfile().then(({ data }) => {
        setFirstName(data.firstName ?? '');
        setLastName(data.lastName ?? '');
        setEmail(data.email ?? '');
        setPhone(data.phone ?? '');
        setEmailVerified(data.emailVerified ?? false);
        setPhoneVerified(data.phoneVerified ?? false);
        setProviders(data.providers ?? []);
        originalEmail.current = data.email ?? '';
        originalEmailVerified.current = data.emailVerified ?? false;
        originalPhone.current = data.phone ?? '';
        originalPhoneVerified.current = data.phoneVerified ?? false;
        // Load chat preferences
        const prefs = (data as any).preferencesJson
          ? JSON.parse((data as any).preferencesJson)
          : (data as any).preferences;
        if (prefs?.chat) {
          setChatAcceptConversations(prefs.chat.acceptConversations ?? false);
          setChatSearchable(prefs.chat.searchable ?? false);
        }
      }),
      usersApi.getAvatarUrl(authUser.id).then((url) => {
        if (url) setAvatarPreview(url);
      }),
    ]).finally(() => setLoaded(true));
  }

  // ---- Avatar handling ----

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => setCropImageSrc(reader.result as string);
    reader.readAsDataURL(file);
  }, []);

  const handleCropConfirm = async (blob: Blob) => {
    setCropImageSrc(null);
    if (!authUser) return;

    // Preview immediately
    setAvatarPreview(URL.createObjectURL(blob));

    try {
      setUploadingAvatar(true);
      await usersApi.uploadAvatar(blob, authUser.id);
      queryClient.invalidateQueries({ queryKey: ['user-avatar'] });
      setMessage({ type: 'success', text: 'Аватар обновлён' });
    } catch {
      setMessage({ type: 'error', text: 'Не удалось загрузить аватар' });
    } finally {
      setUploadingAvatar(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  // ---- Profile save ----

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const phoneDigits = phone.replace(/\D/g, '');
      const originalPhoneDigits = originalPhone.current.replace(/\D/g, '');

      const emailChanged = email.toLowerCase() !== originalEmail.current.toLowerCase();
      const phoneChanged = phoneDigits !== originalPhoneDigits;
      const needsEmailConfirmation = emailChanged && originalEmailVerified.current;
      const needsPhoneConfirmation = phoneChanged && originalPhoneVerified.current;

      // Save profile (backend skips verified email/phone if changed — requires confirmation flow)
      await usersApi.updateProfile({
        name: [firstName, lastName].filter(Boolean).join(' '),
        email: email || undefined,
        phone: phoneDigits || undefined,
        preferences: {
          chat: {
            acceptConversations: chatAcceptConversations,
            searchable: chatSearchable,
          },
        },
      } as any);
      queryClient.invalidateQueries({ queryKey: ['session'] });

      const messages: string[] = [];

      // Handle email change confirmation
      if (needsEmailConfirmation) {
        try {
          const { data } = await usersApi.requestEmailChange(email);
          setEmail(originalEmail.current); // revert input to current email
          messages.push(data.message);
        } catch (err: any) {
          setEmail(originalEmail.current);
          messages.push(err?.response?.data?.message ?? 'Не удалось запросить смену email');
        }
      } else if (emailChanged) {
        originalEmail.current = email.toLowerCase();
        originalEmailVerified.current = false;
        setEmailVerified(false);
      }

      // Handle phone change confirmation
      if (needsPhoneConfirmation) {
        try {
          const { data } = await authApi.requestPhoneChange(phoneDigits);
          setPhone(originalPhone.current); // revert input to current phone
          setPhoneChangePending(true);
          messages.push(data.message);
        } catch (err: any) {
          setPhone(originalPhone.current);
          messages.push(err?.response?.data?.message ?? 'Не удалось запросить смену номера');
        }
      } else if (phoneChanged) {
        originalPhone.current = phoneDigits;
        originalPhoneVerified.current = false;
        setPhoneVerified(false);
      }

      setMessage({
        type: 'success',
        text: messages.length > 0 ? messages.join('. ') : 'Профиль сохранён',
      });
    } catch {
      setMessage({ type: 'error', text: 'Не удалось сохранить профиль' });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 5000);
    }
  };

  // ---- Email resend cooldown ----

  useEffect(() => {
    if (emailResendCooldown <= 0) return;
    const timer = setInterval(() => setEmailResendCooldown((v) => Math.max(0, v - 1)), 1000);
    return () => clearInterval(timer);
  }, [emailResendCooldown]);

  const handleResendConfirmation = async () => {
    if (resendingEmail || emailResendCooldown > 0 || !email) return;
    setResendingEmail(true);
    setEmailResendMessage(null);
    try {
      const { data } = await authApi.resendConfirmation(email);
      setEmailResendCooldown(data.retryAfter ?? 60);
      setEmailResendMessage({ type: 'success', text: 'Письмо отправлено' });
    } catch (err: any) {
      setEmailResendMessage({ type: 'error', text: err?.response?.data?.message ?? 'Не удалось отправить письмо' });
    } finally {
      setResendingEmail(false);
      setTimeout(() => setEmailResendMessage(null), 5000);
    }
  };

  // ---- Skeleton ----

  if (!loaded) {
    return <ProfileFormSkeleton />;
  }

  const displayAvatar = avatarPreview || user?.avatar;

  return (
    <>
      <div className="flex flex-col gap-8">
        {/* Avatar section */}
        <AvatarSection
          displayAvatar={displayAvatar}
          firstName={firstName}
          userFirstName={user?.firstName}
          uploadingAvatar={uploadingAvatar}
          dragOver={dragOver}
          setDragOver={setDragOver}
          onFile={handleFile}
        />

        {/* Separator */}
        <div className="h-px bg-border-light" />

        {/* Form fields */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <FormField label="Имя">
            <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Ваше имя" />
          </FormField>
          <FormField label="Фамилия">
            <Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Ваша фамилия" />
          </FormField>
          <FormField label="Email">
            <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="example@mail.com" />
            {email && !emailVerified && (
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-xs text-amber-600">Email не подтверждён</span>
                <button
                  type="button"
                  onClick={handleResendConfirmation}
                  disabled={resendingEmail || emailResendCooldown > 0}
                  className="text-xs text-brand-red font-medium hover:underline disabled:opacity-50 disabled:no-underline cursor-pointer disabled:cursor-not-allowed"
                >
                  {emailResendCooldown > 0
                    ? `Отправить повторно (${emailResendCooldown}с)`
                    : resendingEmail
                      ? 'Отправка...'
                      : 'Отправить подтверждение'}
                </button>
                {emailResendMessage && (
                  <span className={`text-xs ${emailResendMessage.type === 'success' ? 'text-green-600' : 'text-brand-red'}`}>
                    {emailResendMessage.text}
                  </span>
                )}
              </div>
            )}
            {email && emailVerified && (
              <div className="flex items-center gap-1.5 mt-1.5">
                <svg className="w-3.5 h-3.5 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                <span className="text-xs text-green-600">Email подтверждён</span>
              </div>
            )}
          </FormField>
          <FormField label="Телефон">
            <PhoneInput value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+7 (999) 123-45-67" />
          </FormField>
        </div>

        {/* Login methods */}
        <div className="h-px bg-border-light" />
        <LoginMethodsSection
          providers={providers}
          email={email}
          emailVerified={emailVerified}
          phone={phone}
          phoneVerified={phoneVerified}
          onPhoneVerified={() => setPhoneVerified(true)}
          onResendEmailConfirmation={handleResendConfirmation}
          resendingEmail={resendingEmail}
          emailResendCooldown={emailResendCooldown}
          phoneChangePending={phoneChangePending}
          onPhoneChangeConfirmed={() => {
            setPhoneChangePending(false);
            // Reload profile to get the new phone
            usersApi.getProfile().then(({ data }) => {
              setPhone(data.phone ?? '');
              setPhoneVerified(data.phoneVerified ?? false);
              originalPhone.current = data.phone ?? '';
              originalPhoneVerified.current = data.phoneVerified ?? false;
            });
          }}
        />

        {/* Chat privacy */}
        <div className="h-px bg-border-light" />
        <ChatPreferencesSection
          chatAcceptConversations={chatAcceptConversations}
          setChatAcceptConversations={setChatAcceptConversations}
          chatSearchable={chatSearchable}
          setChatSearchable={setChatSearchable}
        />

        {/* MFA */}
        <div className="h-px bg-border-light" />
        <MfaSection emailVerified={emailVerified} />

        {/* Change password */}
        <div className="h-px bg-border-light" />
        <PasswordSection />

        {/* Message + Save */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <Button onClick={handleSave} disabled={saving} size="lg">
            {saving ? 'Сохранение...' : 'Сохранить'}
          </Button>
          {message && (
            <p className={`text-sm ${message.type === 'success' ? 'text-green-600' : 'text-brand-red'}`}>
              {message.text}
            </p>
          )}
        </div>
      </div>

      {/* Crop modal */}
      {cropImageSrc && (
        <AvatarCropModal
          imageSrc={cropImageSrc}
          onConfirm={handleCropConfirm}
          onCancel={() => setCropImageSrc(null)}
        />
      )}
    </>
  );
}
