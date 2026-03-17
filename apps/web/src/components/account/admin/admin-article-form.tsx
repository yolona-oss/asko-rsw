'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button, Modal, Input, Textarea, FormField } from '@asko/ui';
import { PageContainer } from '@/components/account/page-container';
import { PageHeader } from '@/components/account/page-header';
import { adminApi } from '@/lib/api/admin';

interface ArticleImage {
  id: string;
  order: number;
  image: {
    original: { secure_url: string };
    thumbnail?: { secure_url: string };
    medium?: { secure_url: string };
  };
}

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const CROP_CONTAINER = 420;
const CROP_OUTPUT_W = 800;
const CROP_OUTPUT_H = 600;
const MIN_SCALE = 0.2;
const MAX_SCALE = 4;

function ImageCropModal({
  imageSrc,
  onConfirm,
  onCancel,
}: {
  imageSrc: string;
  onConfirm: (blob: Blob) => void;
  onCancel: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const [imgNatural, setImgNatural] = useState({ w: 0, h: 0 });
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const cropW = 360;
  const cropH = 270;

  const dragging = useRef(false);
  const lastPointer = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const img = new window.Image();
    img.onload = () => {
      imgRef.current = img;
      setImgNatural({ w: img.naturalWidth, h: img.naturalHeight });
      const fitScale = Math.max(cropW / img.naturalWidth, cropH / img.naturalHeight);
      setScale(fitScale);
      setOffset({ x: 0, y: 0 });
    };
    img.src = imageSrc;
  }, [imageSrc]);

  const clampOffset = useCallback(
    (ox: number, oy: number, s: number) => {
      if (!imgNatural.w) return { x: ox, y: oy };
      const maxX = (imgNatural.w * s) / 2 - cropW / 2;
      const maxY = (imgNatural.h * s) / 2 - cropH / 2;
      return {
        x: Math.max(-Math.max(0, maxX), Math.min(Math.max(0, maxX), ox)),
        y: Math.max(-Math.max(0, maxY), Math.min(Math.max(0, maxY), oy)),
      };
    },
    [imgNatural],
  );

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragging.current = true;
    lastPointer.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    const dx = e.clientX - lastPointer.current.x;
    const dy = e.clientY - lastPointer.current.y;
    lastPointer.current = { x: e.clientX, y: e.clientY };
    setOffset((prev) => clampOffset(prev.x + dx, prev.y + dy, scale));
  };

  const handlePointerUp = () => {
    dragging.current = false;
  };

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();
      setScale((prev) => {
        const next = Math.max(MIN_SCALE, Math.min(MAX_SCALE, prev - e.deltaY * 0.001));
        setOffset((o) => clampOffset(o.x, o.y, next));
        return next;
      });
    },
    [clampOffset],
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  const handleConfirm = () => {
    const img = imgRef.current;
    if (!img) return;

    const canvas = document.createElement('canvas');
    canvas.width = CROP_OUTPUT_W;
    canvas.height = CROP_OUTPUT_H;
    const ctx = canvas.getContext('2d')!;

    const srcCenterX = img.naturalWidth / 2 - offset.x / scale;
    const srcCenterY = img.naturalHeight / 2 - offset.y / scale;
    const srcW = cropW / scale;
    const srcH = cropH / scale;

    ctx.drawImage(
      img,
      srcCenterX - srcW / 2,
      srcCenterY - srcH / 2,
      srcW,
      srcH,
      0,
      0,
      CROP_OUTPUT_W,
      CROP_OUTPUT_H,
    );

    canvas.toBlob(
      (blob) => {
        if (blob) onConfirm(blob);
      },
      'image/jpeg',
      0.92,
    );
  };

  if (!imgNatural.w) return null;

  return (
    <Modal open onClose={onCancel} className="flex flex-col items-center gap-4 p-6 w-[480px] max-w-[95vw]">
      <h3 className="text-base font-medium text-text-main">Обрезка изображения</h3>

      <div
        ref={containerRef}
        className="relative select-none touch-none overflow-hidden rounded-sm bg-black/20"
        style={{ width: CROP_CONTAINER, height: CROP_CONTAINER * (cropH / cropW), cursor: 'grab' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <img
          src={imageSrc}
          alt=""
          draggable={false}
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: imgNatural.w * scale,
            height: imgNatural.h * scale,
            transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
            pointerEvents: 'none',
            maxWidth: 'none',
          }}
        />

        <svg
          className="absolute inset-0 pointer-events-none"
          width={CROP_CONTAINER}
          height={CROP_CONTAINER * (cropH / cropW)}
          viewBox={`0 0 ${CROP_CONTAINER} ${CROP_CONTAINER * (cropH / cropW)}`}
        >
          <defs>
            <mask id="article-crop-mask">
              <rect width={CROP_CONTAINER} height={CROP_CONTAINER * (cropH / cropW)} fill="white" />
              <rect
                x={(CROP_CONTAINER - cropW) / 2}
                y={(CROP_CONTAINER * (cropH / cropW) - cropH) / 2}
                width={cropW}
                height={cropH}
                fill="black"
              />
            </mask>
          </defs>
          <rect
            width={CROP_CONTAINER}
            height={CROP_CONTAINER * (cropH / cropW)}
            fill="rgba(0,0,0,0.55)"
            mask="url(#article-crop-mask)"
          />
          <rect
            x={(CROP_CONTAINER - cropW) / 2}
            y={(CROP_CONTAINER * (cropH / cropW) - cropH) / 2}
            width={cropW}
            height={cropH}
            fill="none"
            stroke="white"
            strokeWidth={1.5}
            strokeDasharray="4 3"
            opacity={0.7}
          />
        </svg>
      </div>

      <p className="text-xs text-text-sub text-center">
        Перетащите для перемещения, прокрутите для масштабирования
      </p>

      <div className="flex gap-4 w-full">
        <Button variant="secondary" onClick={onCancel} fullWidth>
          Отмена
        </Button>
        <Button onClick={handleConfirm} fullWidth>
          Сохранить
        </Button>
      </div>
    </Modal>
  );
}

function ArticleImages({ articleId }: { articleId: string }) {
  const [images, setImages] = useState<ArticleImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const dragItem = useRef<number | null>(null);
  const dragOver = useRef<number | null>(null);

  const fetchImages = async () => {
    try {
      const { data } = await adminApi.getArticleImages(articleId);
      setImages((data as ArticleImage[]).sort((a, b) => a.order - b.order));
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
      const file = new File([blob], 'image.jpg', { type: 'image/jpeg' });
      await adminApi.uploadArticleImage(articleId, file);
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
      await adminApi.deleteArticleImage(articleId, imageId);
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
      await adminApi.reorderArticleImages(articleId, reordered.map((img) => img.id));
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
        Первое изображение — превью (для карточек). Второе — основное изображение статьи.
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
                src={img.image.thumbnail?.secure_url ?? img.image.original.secure_url}
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

      {cropSrc && (
        <ImageCropModal
          imageSrc={cropSrc}
          onConfirm={handleCropConfirm}
          onCancel={handleCropCancel}
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
        const { data: article } = await adminApi.getArticle(articleId);
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
        await adminApi.updateArticle(articleId, data);
      } else {
        await adminApi.createArticle(data);
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
