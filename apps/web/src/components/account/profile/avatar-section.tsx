'use client';

import { useRef, type DragEvent, type ChangeEvent } from 'react';
import Image from 'next/image';
import { Upload } from 'lucide-react';

interface AvatarSectionProps {
  displayAvatar: string | undefined;
  firstName: string;
  userFirstName?: string;
  uploadingAvatar: boolean;
  dragOver: boolean;
  setDragOver: (v: boolean) => void;
  onFile: (file: File) => void;
}

export function AvatarSection({
  displayAvatar,
  firstName,
  userFirstName,
  uploadingAvatar,
  dragOver,
  setDragOver,
  onFile,
}: AvatarSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const openFilePicker = () => fileInputRef.current?.click();

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFile(file);
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
    if (file) onFile(file);
  };

  return (
    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
      {/* Avatar preview */}
      <div className="relative flex-shrink-0">
        <div className="w-24 h-24 rounded-full overflow-hidden bg-skeleton">
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
              {firstName?.[0]?.toUpperCase() || userFirstName?.[0]?.toUpperCase() || '?'}
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
          className={`flex flex-col items-center justify-center gap-2 px-6 py-6 border-2 border-dashed cursor-pointer transition-colors ${
            dragOver
              ? 'border-brand-red bg-primary-50'
              : 'border-border-light hover:border-text-sub'
          }`}
        >
          <Upload className="w-8 h-8 text-text-sub" />
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
  );
}
