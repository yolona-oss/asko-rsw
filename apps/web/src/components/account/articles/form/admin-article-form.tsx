'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input, FormField, SkeletonCard } from '@asko/ui';
import { PageContainer } from '@/components/account/layout/page-container';
import { PageHeader } from '@/components/account/layout/page-header';
import { articleApi } from '@/lib/api/article';
import type { ArticleFormProps } from './types';
import { RichTextEditor, plainTextToLexicalState, type RichTextEditorHandle } from './rich-text-editor';
import { ArticleImages } from './article-images';
import { ArticleEdges } from './article-edges';
import { TagInput } from './tag-input';

export function AdminArticleForm({ articleId: initialArticleId }: ArticleFormProps) {
  const router = useRouter();

  const [currentArticleId, setCurrentArticleId] = useState(initialArticleId);
  const isEdit = !!currentArticleId;

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState<Record<string, any> | undefined>(undefined);
  const [tagsInput, setTagsInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!!initialArticleId);
  const [error, setError] = useState('');
  const editorRef = useRef<RichTextEditorHandle>(null);
  const contentReady = useRef(false);

  useEffect(() => {
    if (!initialArticleId) return;
    (async () => {
      try {
        const { data: article } = await articleApi.getOne(initialArticleId);
        setTitle(article.title ?? '');
        setSlug(article.slug ?? '');
        setDescription(article.description ?? '');
        setTagsInput((article.tags ?? []).join(', '));

        // Load rich content or convert legacy plain text
        if (article.content) {
          setContent(article.content);
        } else if (article.text) {
          setContent(plainTextToLexicalState(article.text));
        }
      } catch {
        setError('Не удалось загрузить статью');
      } finally {
        setLoading(false);
      }
    })();
  }, [initialArticleId]);

  const handleContentChange = (json: Record<string, any>) => {
    contentReady.current = true;
    setContent(json);
  };

  const handleRequestArticleId = async (): Promise<string | null> => {
    if (currentArticleId) return currentArticleId;
    if (!title.trim()) {
      setError('Введите заголовок перед загрузкой изображений');
      return null;
    }
    try {
      const tags = tagsInput.split(',').map((t) => t.trim()).filter(Boolean);
      const { data: created } = await articleApi.create({ title, content, tags, description: description || undefined });
      setCurrentArticleId(created.id);
      return created.id;
    } catch {
      setError('Не удалось сохранить статью');
      return null;
    }
  };

  const handleSave = async () => {
    setError('');
    setSaving(true);
    try {
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      const data = currentArticleId
        ? { title, slug: slug || undefined, content, tags, description: description || undefined }
        : { title, content, tags, description: description || undefined };

      if (currentArticleId) {
        await articleApi.update(currentArticleId, data);
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
        <SkeletonCard className="h-[400px]" />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader>
        {isEdit ? 'Редактирование статьи' : 'Новая статья'}
      </PageHeader>

      <div className="max-w-[900px] flex flex-col gap-6">
        <FormField label="Заголовок" variant="bold">
          <Input
            type="text"
            placeholder="Заголовок статьи"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="max-w-[500px]"
          />
        </FormField>

        {currentArticleId && (
          <FormField label="Slug (URL)" variant="bold">
            <Input
              type="text"
              placeholder="url-slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
              className="max-w-[500px] font-mono text-sm"
            />
            <p className="text-xs text-text-sub mt-1">
              /articles/{slug || '...'}
            </p>
          </FormField>
        )}

        <FormField label="Описание (для превью и SEO)" variant="bold">
          <Input
            type="text"
            placeholder="Краткое описание статьи"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={500}
            className="max-w-[500px]"
          />
        </FormField>

        <FormField label="Теги" variant="bold">
          <TagInput value={tagsInput} onChange={setTagsInput} />
        </FormField>

        <FormField label="Текст статьи" variant="bold">
          <RichTextEditor
            ref={editorRef}
            content={content}
            onChange={handleContentChange}
            articleId={currentArticleId}
            onRequestArticleId={handleRequestArticleId}
          />
        </FormField>

        {currentArticleId && (
          <FormField label="Превью и основное изображение" variant="bold">
            <ArticleImages
              articleId={currentArticleId}
              onInsertImage={(src) => editorRef.current?.insertImage(src)}
            />
          </FormField>
        )}

        {currentArticleId && (
          <FormField label="Связи с другими статьями" variant="bold">
            <ArticleEdges articleId={currentArticleId} />
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
            disabled={saving || !title.trim()}
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
