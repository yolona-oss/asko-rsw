'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button, Input, Textarea, FormField, CropModal } from '@asko/ui';
import { PageContainer } from '@/components/account/page-container';
import { PageHeader } from '@/components/account/page-header';
import { articleApi } from '@/lib/api/article';
import type { IImageAttachment } from '@/lib/api/types';

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

function ArticleImages({ articleId }: { articleId: string }) {
  const [images, setImages] = useState<IImageAttachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const dragItem = useRef<number | null>(null);
  const dragOver = useRef<number | null>(null);

  const fetchImages = async () => {
    try {
      const { data } = await articleApi.getImages(articleId);
      setImages((data.images).sort((a, b) => a.order - b.order));
    } catch {
      // silently fail
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
                src={img.imageJson.thumbnail?.secure_url ?? img.imageJson.original.secure_url}
                alt=""
                width={150}
                height={150}
                className="w-full h-auto object-cover aspect-square pointer-events-none"
              />
              <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-black/50 text-white rounded-sm text-[10px] font-medium">
                {imageLabel(i)}
              </div>
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
        accept=".webp,.webp,.webp,.webp"
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

      {cropSrc && (
        <CropModal
          imageSrc={cropSrc}
          onConfirm={handleCropConfirm}
          onCancel={handleCropCancel}
          shape="rectangle"
          outputWidth={800}
          outputHeight={600}
          cropWidth={360}
          cropHeight={270}
        />
      )}
    </div>
  );
}

interface ArticleFormProps {
  articleId?: string;
}

export function AdminArticleForm({ articleId }: ArticleFormProps) {
  const router = useRouter();
  const isEdit = !!articleId;

  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      try {
        const { data: article } = await articleApi.getOne(articleId);
        setTitle(article.title ?? '');
        setText(article.text ?? '');
        setTagsInput((article.tags ?? []).join(', '));
      } catch {
        setError('Не удалось загрузить статью');
      } finally {
        setLoading(false);
      }
    })();
  }, [articleId, isEdit]);

  const handleSave = async () => {
    setError('');
    setSaving(true);
    try {
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      const data = { title, text, tags };

      if (isEdit) {
        await articleApi.update(articleId, data);
      } else {
        await articleApi.create(data);
      }
      router.push('/account/articles');
    } catch {
      setError(isEdit ? 'Ошибка при обновлении статьи' : 'Ошибка при создании статьи');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <p className="text-sm text-text-sub p-4">Загрузка...</p>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader>
        {isEdit ? 'Редактирование статьи' : 'Новая статья'}
      </PageHeader>

      <div className="max-w-[600px] flex flex-col gap-6">
        <FormField label="Заголовок" variant="bold">
          <Input
            type="text"
            placeholder="Заголовок статьи"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="max-w-[500px]"
          />
        </FormField>

        <FormField label="Теги (через запятую)" variant="bold">
          <Input
            type="text"
            placeholder="ремонт, ASKO, обслуживание"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            className="max-w-[500px]"
          />
        </FormField>

        <FormField label="Текст статьи" variant="bold">
          <Textarea
            placeholder="Текст статьи. Каждый абзац с новой строки."
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={16}
            className="max-w-[500px]"
          />
        </FormField>

        {isEdit && articleId && (
          <FormField label="Изображения" variant="bold">
            <ArticleImages articleId={articleId} />
          </FormField>
        )}

        {error && <p className="text-sm text-brand-red">{error}</p>}

        <div className="flex items-center gap-4 mt-2">
          <Button variant="secondary" onClick={() => router.push('/account/articles')}>
            Отмена
          </Button>
          <Button
            variant="primary"
            size="lg"
            onClick={handleSave}
            disabled={saving || !title.trim() || !text.trim()}
          >
            {isEdit
              ? (saving ? 'Сохранение...' : 'Сохранить')
              : (saving ? 'Создание...' : 'Создать статью')}
          </Button>
        </div>
      </div>
    </PageContainer>
  );
}
