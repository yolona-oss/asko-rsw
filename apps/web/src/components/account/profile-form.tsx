'use client';

import { useState, useRef, useCallback, type DragEvent, type ChangeEvent } from 'react';
import Image from 'next/image';
import { useAccount } from './account-provider';
import { useAuth } from '@/lib/api/use-auth';
import { profileApi } from '@/lib/api/profile';
import { AvatarCropModal } from './avatar-crop-modal';
import { SkeletonBlock, SkeletonCircle } from './skeleton';

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-sm font-medium text-text-sub">{children}</label>
  );
}

function FieldInput({
  value,
  onChange,
  type = 'text',
  placeholder,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className="w-full px-4 py-2.5 text-sm text-text-main bg-white border border-border-light focus:border-text-main outline-none transition-colors disabled:opacity-50"
    />
  );
}

export function ProfileForm() {
  const { user } = useAccount();
  const { user: authUser } = useAuth();

  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loaded, setLoaded] = useState(false);

  // Avatar state
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Submission state
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load profile data once
  const profileLoaded = useRef(false);
  if (!profileLoaded.current && authUser) {
    profileLoaded.current = true;
    Promise.all([
      profileApi.getProfile().then(({ data }) => {
        setFirstName(data.firstName ?? '');
        setLastName(data.lastName ?? '');
        setEmail(data.email ?? '');
        setPhone(data.phone ?? '');
      }),
      profileApi.getAvatarUrl(authUser.id).then((url) => {
        if (url) setAvatarPreview(url);
      }),
    ]).finally(() => setLoaded(true));
  }

  // ---- Avatar handling ----

  const openFilePicker = () => fileInputRef.current?.click();

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => setCropImageSrc(reader.result as string);
    reader.readAsDataURL(file);
  }, []);

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleCropConfirm = async (blob: Blob) => {
    setCropImageSrc(null);
    if (!authUser) return;

    // Preview immediately
    setAvatarPreview(URL.createObjectURL(blob));

    try {
      setUploadingAvatar(true);
      await profileApi.uploadAvatar(blob, authUser.id);
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
      await profileApi.updateProfile({
        name: [firstName, lastName].filter(Boolean).join(' '),
        email: email || undefined,
        phone: phone || undefined,
      });
      setMessage({ type: 'success', text: 'Профиль сохранён' });
    } catch {
      setMessage({ type: 'error', text: 'Не удалось сохранить профиль' });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  // ---- Skeleton ----

  if (!loaded) {
    return (
      <div className="flex flex-col gap-8">
        <div className="flex flex-col sm:flex-row items-start gap-6">
          <SkeletonCircle className="w-24 h-24 flex-shrink-0" />
          <div className="flex flex-col gap-2 w-full">
            <SkeletonBlock className="h-5 w-40" />
            <SkeletonBlock className="h-4 w-64" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <SkeletonBlock className="h-4 w-20" />
              <SkeletonBlock className="h-10 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const displayAvatar = avatarPreview || user?.avatar;

  return (
    <>
      <div className="flex flex-col gap-8">
        {/* Avatar section */}
        <div className="flex flex-col sm:flex-row items-start gap-6">
          {/* Avatar preview */}
          <div className="relative flex-shrink-0">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-[#C4C4C4]">
              {displayAvatar ? (
                <Image
                  src={displayAvatar}
                  alt=""
                  width={96}
                  height={96}
                  className="object-cover w-full h-full"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl text-white font-medium">
                  {firstName?.[0]?.toUpperCase() || user?.name?.[0]?.toUpperCase() || '?'}
                </div>
              )}
            </div>
            {uploadingAvatar && (
              <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>

          {/* Upload zone */}
          <div className="flex flex-col gap-3 w-full">
            <p className="text-sm font-medium text-text-main">Фото профиля</p>
            <div
              role="button"
              tabIndex={0}
              onClick={openFilePicker}
              onKeyDown={(e) => e.key === 'Enter' && openFilePicker()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`flex flex-col items-center justify-center gap-2 px-6 py-6 border-2 border-dashed rounded-sm cursor-pointer transition-colors ${
                dragOver
                  ? 'border-brand-red bg-primary-50'
                  : 'border-border-light hover:border-text-sub'
              }`}
            >
              <svg className="w-8 h-8 text-text-sub" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              <p className="text-sm text-text-sub text-center">
                Перетащите изображение сюда или{' '}
                <span className="text-brand-red font-medium">выберите файл</span>
              </p>
              <p className="text-xs text-text-sub/60">JPG, PNG, WEBP до 5 МБ</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleFileInput}
            />
          </div>
        </div>

        {/* Separator */}
        <div className="h-px bg-border-light" />

        {/* Form fields */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="flex flex-col gap-2">
            <FieldLabel>Имя</FieldLabel>
            <FieldInput value={firstName} onChange={setFirstName} placeholder="Ваше имя" />
          </div>
          <div className="flex flex-col gap-2">
            <FieldLabel>Фамилия</FieldLabel>
            <FieldInput value={lastName} onChange={setLastName} placeholder="Ваша фамилия" />
          </div>
          <div className="flex flex-col gap-2">
            <FieldLabel>Email</FieldLabel>
            <FieldInput value={email} onChange={setEmail} type="email" placeholder="example@mail.com" />
          </div>
          <div className="flex flex-col gap-2">
            <FieldLabel>Телефон</FieldLabel>
            <FieldInput value={phone} onChange={setPhone} type="tel" placeholder="+7 (999) 123-45-67" />
          </div>
        </div>

        {/* Message + Save */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center justify-center px-8 py-2.5 text-sm font-medium text-white bg-brand-red disabled:opacity-50 cursor-pointer"
          >
            {saving ? 'Сохранение...' : 'Сохранить'}
          </button>
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
