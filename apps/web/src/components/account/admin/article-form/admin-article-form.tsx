'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input, FormField } from '@asko/ui';
import { PageContainer } from '@/components/account/page-container';
import { PageHeader } from '@/components/account/page-header';
import { articleApi } from '@/lib/api/article';
import type { ArticleFormProps } from './types';
import { ArticleImages } from './article-images';
import { RichTextEditor, plainTextToLexicalState } from './rich-text-editor';

export function AdminArticleForm({ articleId: initialArticleId }: ArticleFormProps) {
  const router = useRouter();

  const [currentArticleId, setCurrentArticleId] = useState(initialArticleId);
  const isEdit = !!currentArticleId;

  const [title, setTitle] = useState('');
  const [content, setContent] = useState<Record<string, any> | undefined>(undefined);
  const [tagsInput, setTagsInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!!initialArticleId);
  const [error, setError] = useState('');
  const contentReady = useRef(false);

  useEffect(() => {
    if (!initialArticleId) return;
    (async () => {
      try {
        const { data: article } = await articleApi.getOne(initialArticleId);
        setTitle(article.title ?? '');
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
      const { data: created } = await articleApi.create({ title, content, tags });
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
      const data = { title, content, tags };

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
        <p className="text-sm text-text-sub p-4">Загрузка...</p>
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
          <RichTextEditor
            content={content}
            onChange={handleContentChange}
            articleId={currentArticleId}
            onRequestArticleId={handleRequestArticleId}
          />
        </FormField>

        {currentArticleId && (
          <FormField label="Изображения" variant="bold">
            <ArticleImages articleId={currentArticleId} />
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
