'use client';

import { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAccount } from '../layout/provider';
import { useAuth } from '@/lib/api/use-auth';
import { usersApi } from '@/lib/api/users';
import { authApi } from '@/lib/api/auth';
import { AvatarCropModal } from '../layout/avatar-crop-modal';
import { Button, FormField, PhoneInput, EmailInput, NameInput, Card } from '@asko/ui';
import type { PrivacyRules } from '@asko/shared/client';
import { useFormGuard } from '@/hooks/use-form-guard';
import { useAppSelector, useAppDispatch } from '@/store/index';
import {
    selectUserSettings,
    setLanguage as setLanguageAction,
    setUserSettings,
    setChatAcceptConversations as setChatAcceptAction,
    setChatSearchable as setChatSearchAction,
    setPrivacyRules as setPrivacyAction,
} from '@/store/preferences-slice';
import { PageContainer } from '../layout/page-container';
import { PageHeader } from '../layout/page-header';
import { EditedMark } from '@/components/shared/edited-mark';
import { useAutoReset } from '@/lib/hooks/use-auto-reset';
import type { StatusMessage } from './types';
import { ProfileFormSkeleton } from '@/components/skeleton';
import { AvatarSection } from './avatar-section';
import { ChatPreferencesSection } from './chat-preferences-section';
import { PrivacySection } from './privacy-section';
import { MfaSection } from './mfa-section';
import { LoginMethodsSection } from './login-methods-section';
import { PasswordSection } from './password-section';
import { SessionsSection } from './sessions-section';
import { LanguageSection } from './language-section';
import { AddressesSection } from './addresses-section';
import { NotificationSettingsSection } from './notification-settings-section';

import {
  RUSSIAN_NAMES,
  RUSSIAN_SURNAMES,
  RUSSIAN_PATRONYMICS,
} from '@/data/russian-names';

export function ProfileForm() {
  const { user } = useAccount();
  const { user: authUser } = useAuth();
  const queryClient = useQueryClient();
  const setLanguage = (lang: string) => reduxDispatch(setLanguageAction(lang as any));
  const reduxDispatch = useAppDispatch();
  const userSettings = useAppSelector(selectUserSettings);

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

  // Chat preferences + Privacy — backed by Redux
  const chatAcceptConversations = userSettings.chatAcceptConversations;
  const chatSearchable = userSettings.chatSearchable;
  const privacyRules = userSettings.privacyRules;
  const setChatAcceptConversations = useCallback((v: boolean) => reduxDispatch(setChatAcceptAction(v)), [reduxDispatch]);
  const setChatSearchable = useCallback((v: boolean) => reduxDispatch(setChatSearchAction(v)), [reduxDispatch]);
  const setPrivacyRules = useCallback((v: PrivacyRules | null) => reduxDispatch(setPrivacyAction(v)), [reduxDispatch]);

  // Form guard
  type ProfileSnapshot = { fullName: string; email: string; phone: string; chatAcceptConversations: boolean; chatSearchable: boolean; privacyRules: PrivacyRules | null };
  const formState = useMemo<ProfileSnapshot>(
    () => ({ fullName, email, phone, chatAcceptConversations, chatSearchable, privacyRules }),
    [fullName, email, phone, chatAcceptConversations, chatSearchable, privacyRules],
  );
  const [initialState, setInitialState] = useState<ProfileSnapshot | undefined>(undefined);

  // Avatar state
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  // Submission state
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [message, setMessage] = useAutoReset<StatusMessage>(null, 5000);

  // Load profile data once
  const profileLoaded = useRef(false);
  if (!profileLoaded.current && authUser) {
    profileLoaded.current = true;
    Promise.all([
      usersApi.getProfile().then(({ data }) => {
        setFullName([data.lastName, data.firstName, data.middleName].filter(Boolean).join(' '));
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
        const chatAccept = settings?.chatAcceptConversations ?? false;
        const chatSearch = settings?.chatSearchable ?? false;
        const privRules = settings?.privacyRulesJson
          ? (() => { try { return JSON.parse(settings.privacyRulesJson); } catch { return null; } })()
          : null;
        if (settings) {
          reduxDispatch(setUserSettings({
            chatAcceptConversations: chatAccept,
            chatSearchable: chatSearch,
            privacyRules: privRules,
          }));
          if (settings.language) setLanguage(settings.language);
        }
        setInitialState({
          fullName: [data.lastName, data.firstName, data.middleName].filter(Boolean).join(' '),
          email: data.email ?? '',
          phone: data.phone ?? '',
          chatAcceptConversations: chatAccept,
          chatSearchable: chatSearch,
          privacyRules: privRules,
        });
      }),
      usersApi.getAvatarUrl(authUser.id).then((url) => {
        if (url) setAvatarPreview(url);
      }),
    ]).finally(() => setLoaded(true));
  }

  const handleApplyDraft = useCallback((data: ProfileSnapshot) => {
    setFullName(data.fullName);
    setEmail(data.email);
    setPhone(data.phone);
    reduxDispatch(setUserSettings({
      chatAcceptConversations: data.chatAcceptConversations,
      chatSearchable: data.chatSearchable,
      privacyRules: data.privacyRules,
    }));
  }, [reduxDispatch]);

  const guard = useFormGuard<ProfileSnapshot>({
    storageKey: 'profile',
    currentState: formState,
    initialState,
    onSave: async () => { await handleSave(); },
    onApplyDraft: handleApplyDraft,
    fieldLabels: {
      fullName: 'ФИО',
      email: 'Email',
      phone: 'Телефон',
      chatAcceptConversations: 'Приём сообщений',
      chatSearchable: 'Видимость в поиске',
      privacyRules: 'Приватность',
    },
  });

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
          privacyRules: privacyRules ?? undefined,
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
      guard.markSaved();
      setInitialState({ fullName, email, phone, chatAcceptConversations, chatSearchable, privacyRules });
    } catch {
      setMessage({ type: 'error', text: 'Не удалось сохранить профиль' });
    } finally {
      setSaving(false);
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
    return (
      <PageContainer>
        <PageHeader>Профиль</PageHeader>
        <Card>
          <ProfileFormSkeleton />
        </Card>
      </PageContainer>
    );
  }

  const displayAvatar = avatarPreview || user?.avatar;

  return (
    <>
      <PageContainer>
        <PageHeader>Профиль</PageHeader>
        <Card>
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

        {/* Addresses */}
        <div className="h-px bg-border-light" />
        <AddressesSection />

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

        {/* Notifications & Sound */}
        <div className="h-px bg-border-light" />
        <NotificationSettingsSection />

        {/* Chat privacy */}
        <div className="h-px bg-border-light" />
        <ChatPreferencesSection
          chatAcceptConversations={chatAcceptConversations}
          setChatAcceptConversations={setChatAcceptConversations}
          chatSearchable={chatSearchable}
          setChatSearchable={setChatSearchable}
        />

        {/* Privacy settings */}
        <div className="h-px bg-border-light" />
        <PrivacySection
          privacyRules={privacyRules}
          setPrivacyRules={setPrivacyRules}
        />

        {/* Language */}
        <div className="h-px bg-border-light" />
        <LanguageSection />

        {/* MFA */}
        <div className="h-px bg-border-light" />
        <MfaSection emailVerified={emailVerified} />

        {/* Change password */}
        <div className="h-px bg-border-light" />
        <PasswordSection />

        {/* Active sessions */}
        <div className="h-px bg-border-light" />
        <SessionsSection />

        {/* Message + Save */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <Button onClick={handleSave} disabled={saving} size="lg">
            {saving ? 'Сохранение...' : 'Сохранить'}
          </Button>
          <EditedMark visible={guard.dirty} />
          {message && (
            <p className={`text-sm ${message.type === 'success' ? 'text-success' : 'text-brand-red'}`}>
              {message.text}
            </p>
          )}
            </div>
          </div>
        </Card>
      </PageContainer>

      {guard.guardDialog}
      {guard.draftDialog}

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
