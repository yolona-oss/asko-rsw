'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input, Textarea, FormField } from '@asko/ui';
import { PageContainer } from '@/components/account/page-container';
import { PageHeader } from '@/components/account/page-header';
import { articleApi } from '@/lib/api/article';
import type { ArticleFormProps } from './types';
import { ArticleImages } from './article-images';

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
