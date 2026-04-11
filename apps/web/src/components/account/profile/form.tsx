'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAccount } from '../layout/provider';
import { useAuth } from '@/lib/api/use-auth';
import { usersApi } from '@/lib/api/users';
import { authApi } from '@/lib/api/auth';
import { AvatarCropModal } from '../layout/avatar-crop-modal';
import { Button, FormField, PhoneInput, EmailInput, NameInput } from '@asko/ui';
import type { StatusMessage } from './types';
import { ProfileFormSkeleton } from '@/components/skeleton';
import { AvatarSection } from './avatar-section';
import { ChatPreferencesSection } from './chat-preferences-section';
import { MfaSection } from './mfa-section';
import { LoginMethodsSection } from './login-methods-section';
import { PasswordSection } from './password-section';

import {
  RUSSIAN_NAMES,
  RUSSIAN_SURNAMES,
  RUSSIAN_PATRONYMICS,
} from '@/data/russian-names';

export function ProfileForm() {
  const { user } = useAccount();
  const { user: authUser } = useAuth();
  const queryClient = useQueryClient();

  // Form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loaded, setLoaded] = useState(false);

  // Providers & verification
  const [providers, setProviders] = useState<string[]>([]);

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
        setFullName([data.lastName, data.firstName, (data as any).middleName].filter(Boolean).join(' '));
        setEmail(data.email ?? '');
        setPhone(data.phone ?? '');
        setEmailVerified(data.emailVerified ?? false);
        setProviders(data.providers ?? []);
        originalEmail.current = data.email ?? '';
        originalEmailVerified.current = data.emailVerified ?? false;
        originalPhone.current = data.phone ?? '';
        originalPhoneVerified.current = data.phoneVerified ?? false;
        // Load chat preferences from structured settings
        const settings = (data as any).settings;
        if (settings) {
          setChatAcceptConversations(settings.chatAcceptConversations ?? false);
          setChatSearchable(settings.chatSearchable ?? false);
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
      const nameParts = fullName.trim().split(/\s+/);
      const [pLastName, pFirstName, pMiddleName] = [nameParts[0], nameParts[1], nameParts[2]];

      await usersApi.updateProfile({
        name: [pLastName, pFirstName].filter(Boolean).join(' '),
        middleName: pMiddleName || undefined,
        email: email || undefined,
        phone: phoneDigits || undefined,
        settings: {
          chatAcceptConversations,
          chatSearchable,
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
    try {
      const { data } = await authApi.resendConfirmation(email);
      setEmailResendCooldown(data.retryAfter ?? 60);
    } catch {
      // Error handled by LoginMethodsSection UI
    } finally {
      setResendingEmail(false);
    }
  };

  // ---- Skeleton ----

  if (!loaded) {
    return <ProfileFormSkeleton />;
  }

  const displayAvatar = avatarPreview || user?.avatar;

  return (
    <>
      <div className="flex flex-col gap-6 lg:gap-8">
        {/* Avatar section */}
        <AvatarSection
          displayAvatar={displayAvatar}
          firstName={fullName.split(/\s+/)[1] ?? fullName.split(/\s+/)[0] ?? ''}
          userFirstName={user?.firstName}
          uploadingAvatar={uploadingAvatar}
          dragOver={dragOver}
          setDragOver={setDragOver}
          onFile={handleFile}
        />

        {/* Separator */}
        <div className="h-px bg-border-light" />

        {/* Form fields */}
        <div className="flex flex-col gap-6">
          <FormField label="ФИО">
            <NameInput
              type="text"
              names={RUSSIAN_NAMES}
              surnames={RUSSIAN_SURNAMES}
              patronymics={RUSSIAN_PATRONYMICS}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Фамилия Имя Отчество"
            />
          </FormField>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <FormField label="Email">
              <EmailInput value={email} onChange={(e) => setEmail(e.target.value)} placeholder="example@mail.com" />
            </FormField>
            <FormField label="Телефон">
              <PhoneInput value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+7 (999) 123-45-67" />
            </FormField>
          </div>
        </div>

        {/* Login methods */}
        <div className="h-px bg-border-light" />
        <LoginMethodsSection
          providers={providers}
          email={email}
          emailVerified={emailVerified}
          phone={phone}
          onPhoneVerified={() => {
            usersApi.getProfile().then(({ data }) => {
              setProviders(data.providers ?? []);
              originalPhoneVerified.current = data.phoneVerified ?? false;
            });
          }}
          onResendEmailConfirmation={handleResendConfirmation}
          resendingEmail={resendingEmail}
          emailResendCooldown={emailResendCooldown}
          phoneChangePending={phoneChangePending}
          onPhoneChangeConfirmed={() => {
            setPhoneChangePending(false);
            // Reload profile to get the new phone + providers
            usersApi.getProfile().then(({ data }) => {
              setPhone(data.phone ?? '');
              setProviders(data.providers ?? []);
              originalPhone.current = data.phone ?? '';
              originalPhoneVerified.current = data.phoneVerified ?? false;
            });
          }}
          onUnlinkOAuth={async (provider) => {
            try {
              await authApi.unlinkOAuth(provider);
              setProviders((prev) => prev.filter((p) => p !== provider.toUpperCase()));
            } catch { /* handled by interceptor */ }
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
