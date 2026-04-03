'use client';

import { getImageUrl } from '@/lib/image-url';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Button, CropModal } from '@asko/ui';
import { articleApi } from '@/lib/api/article';
import type { IImageAttachment } from '@/lib/api/types';
import { ACCEPTED_IMAGE_TYPES, MAX_IMAGE_SIZE } from './constants';

interface ArticleImagesProps {
  articleId: string;
  onInsertImage?: (src: string) => void;
}

export function ArticleImages({ articleId, onInsertImage }: ArticleImagesProps) {
  const [images, setImages] = useState<IImageAttachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const nextImageIndex = images.length;
  const fileRef = useRef<HTMLInputElement>(null);
  const dragItem = useRef<number | null>(null);
  const dragOver = useRef<number | null>(null);

  const fetchImages = async () => {
    try {
      const { data } = await articleApi.getImages(articleId);
      setImages((data.images).sort((a, b) => a.order - b.order));
    } catch {
    }
  };

  useEffect(() => {
    fetchImages();
  }, [articleId]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setError('Допустимые форматы: JPG, PNG, WebP');
      if (fileRef.current) fileRef.current.value = '';
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setError('Максимальный размер файла: 10 МБ');
      if (fileRef.current) fileRef.current.value = '';
      return;
    }

    setError('');
    const url = URL.createObjectURL(file);
    setCropSrc(url);
  };

  const handleCropConfirm = async (blob: Blob) => {
    setCropSrc(null);
    if (fileRef.current) fileRef.current.value = '';
    setUploading(true);
    try {
      const file = new File([blob], 'image.webp', { type: 'image/jpeg' });
      await articleApi.uploadImage(articleId, file);
      await fetchImages();
    } catch {
      setError('Ошибка загрузки изображения');
    } finally {
      setUploading(false);
    }
  };

  const handleCropCancel = () => {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleDelete = async (imageId: string) => {
    try {
      await articleApi.deleteImage(articleId, imageId);
      setImages((prev) => prev.filter((img) => img.id !== imageId));
    } catch {
      setError('Ошибка удаления изображения');
    }
  };

  const handleDragStart = (index: number) => {
    dragItem.current = index;
  };

  const handleDragEnter = (index: number) => {
    dragOver.current = index;
  };

  const handleDragEnd = async () => {
    if (dragItem.current === null || dragOver.current === null || dragItem.current === dragOver.current) {
      dragItem.current = null;
      dragOver.current = null;
      return;
    }

    const reordered = [...images];
    const [moved] = reordered.splice(dragItem.current, 1);
    reordered.splice(dragOver.current, 0, moved);

    dragItem.current = null;
    dragOver.current = null;

    setImages(reordered);

    try {
      await articleApi.reorderImages(articleId, reordered.map((img) => img.id));
    } catch {
      await fetchImages();
    }
  };

  const imageLabel = (i: number) => {
    if (i === 0) return 'Превью';
    if (i === 1) return 'Основное';
    return `#${i + 1}`;
  };

  return (
    <div className="flex flex-col gap-3 max-w-[500px]">
      <p className="text-xs text-text-sub">
        Первое изображение - превью (для карточек). Второе - основное изображение статьи.
        Перетаскивайте для изменения порядка.
      </p>

      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {images.map((img, i) => (
            <div
              key={img.id}
              draggable
              onDragStart={() => handleDragStart(i)}
              onDragEnter={() => handleDragEnter(i)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => e.preventDefault()}
              className="relative group border border-gray-200 rounded-sm overflow-hidden cursor-grab active:cursor-grabbing"
            >
              <Image
                src={getImageUrl(img, 'thumbnail')!}
                alt=""
                width={150}
                height={150}
                className="w-full h-auto object-cover aspect-square pointer-events-none"
              />
              <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-black/50 text-white rounded-sm text-[10px] font-medium">
                {imageLabel(i)}
              </div>
              {onInsertImage && (
                <button
                  type="button"
                  onClick={() => {
                    const src = getImageUrl(img, 'large')!;
                    onInsertImage(src);
                  }}
                  className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-brand-red text-white rounded-sm text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  Вставить
                </button>
              )}
              <button
                type="button"
                onClick={() => handleDelete(img.id)}
                className="absolute top-1 right-1 w-6 h-6 bg-red-600 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp"
        className="hidden"
        onChange={handleFileSelect}
      />
      <Button
        variant="secondary"
        size="sm"
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        className="self-start"
      >
        {uploading ? 'Загрузка...' : '+ Загрузить изображение'}
      </Button>
      {error && <p className="text-xs text-brand-red">{error}</p>}

      {cropSrc && nextImageIndex === 0 && (
        <CropModal
          imageSrc={cropSrc}
          onConfirm={handleCropConfirm}
          onCancel={handleCropCancel}
          shape="rectangle"
          outputWidth={524}
          outputHeight={408}
          cropWidth={262}
          cropHeight={204}
          title="Превью статьи"
        />
      )}
      {cropSrc && nextImageIndex === 1 && (
        <CropModal
          imageSrc={cropSrc}
          onConfirm={handleCropConfirm}
          onCancel={handleCropCancel}
          shape="rectangle"
          outputWidth={1920}
          outputHeight={531}
          cropWidth={384}
          cropHeight={106}
          title="Основное изображение"
        />
      )}
      {cropSrc && nextImageIndex >= 2 && (
        <CropModal
          imageSrc={cropSrc}
          onConfirm={handleCropConfirm}
          onCancel={handleCropCancel}
          shape="rectangle"
          outputWidth={1920}
          outputHeight={1080}
          cropWidth={384}
          cropHeight={216}
          title="Изображение статьи"
        />
      )}
    </div>
  );
}
