'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input, FormField, SkeletonCard } from '@asko/ui';
import { PageContainer } from '@/components/account/layout/page-container';
import { PageHeader } from '@/components/account/layout/page-header';
import { useFormGuard } from '@/hooks/use-form-guard';
import { EditedMark } from '@/components/shared/edited-mark';
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

  // --- Form guard ---
  type FormSnapshot = { title: string; slug: string; description: string; content: Record<string, any> | undefined; tagsInput: string };
  const formState = useMemo<FormSnapshot>(
    () => ({ title, slug, description, content, tagsInput }),
    [title, slug, description, content, tagsInput],
  );
  const initialStateRef = useRef<FormSnapshot | undefined>(undefined);
  const [initialState, setInitialState] = useState<FormSnapshot | undefined>(undefined);

  useEffect(() => {
    if (!initialArticleId) return;
    (async () => {
      try {
        const { data: article } = await articleApi.getOne(initialArticleId);
        setTitle(article.title ?? '');
        setSlug(article.slug ?? '');
        setDescription(article.description ?? '');
        setTagsInput((article.tags ?? []).join(', '));

        let loadedContent: Record<string, any> | undefined;
        if (article.content) {
          loadedContent = article.content;
          setContent(article.content);
        } else if (article.text) {
          loadedContent = plainTextToLexicalState(article.text);
          setContent(loadedContent);
        }

        const snap: FormSnapshot = {
          title: article.title ?? '',
          slug: article.slug ?? '',
          description: article.description ?? '',
          content: loadedContent,
          tagsInput: (article.tags ?? []).join(', '),
        };
        initialStateRef.current = snap;
        setInitialState(snap);
      } catch {
        setError('Не удалось загрузить статью');
      } finally {
        setLoading(false);
      }
    })();
  }, [initialArticleId]);

  // For new articles, set initial state immediately
  useEffect(() => {
    if (!initialArticleId && !initialStateRef.current) {
      const snap: FormSnapshot = { title: '', slug: '', description: '', content: undefined, tagsInput: '' };
      initialStateRef.current = snap;
      setInitialState(snap);
    }
  }, [initialArticleId]);

  const handleApplyDraft = useCallback((data: FormSnapshot) => {
    setTitle(data.title);
    setSlug(data.slug);
    setDescription(data.description);
    setContent(data.content);
    setTagsInput(data.tagsInput);
  }, []);

  // Pure save — no navigation, used by both guard dialog and save button
  const saveArticle = useCallback(async () => {
    setError('');
    const tags = tagsInput.split(',').map((t) => t.trim()).filter(Boolean);
    const payload = currentArticleId
      ? { title, slug: slug || undefined, content, tags, description: description || undefined }
      : { title, content, tags, description: description || undefined };
    if (currentArticleId) {
      await articleApi.update(currentArticleId, payload);
    } else {
      await articleApi.create(payload);
    }
  }, [title, slug, description, content, tagsInput, currentArticleId]);

  const guard = useFormGuard<FormSnapshot>({
    storageKey: `article-${currentArticleId || 'new'}`,
    currentState: formState,
    initialState,
    onSave: saveArticle,
    onApplyDraft: handleApplyDraft,
    fieldLabels: {
      title: 'Заголовок',
      slug: 'Slug (URL)',
      description: 'Описание',
      content: 'Текст статьи',
      tagsInput: 'Теги',
    },
  });

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
    setSaving(true);
    try {
      await saveArticle();
      guard.markSaved();
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
        <span className="flex items-center gap-3">
          {isEdit ? 'Редактирование статьи' : 'Новая статья'}
          <EditedMark visible={guard.dirty} />
        </span>
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
          <Button variant="secondary" onClick={() => guard.guardedNavigate('/account/articles')}>
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

      {guard.guardDialog}
      {guard.draftDialog}
    </PageContainer>
  );
}
