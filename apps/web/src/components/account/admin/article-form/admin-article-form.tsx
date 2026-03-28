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

export function AdminArticleForm({ articleId }: ArticleFormProps) {
  const router = useRouter();
  const isEdit = !!articleId;

  const [title, setTitle] = useState('');
  const [content, setContent] = useState<Record<string, any> | undefined>(undefined);
  const [tagsInput, setTagsInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [error, setError] = useState('');
  const contentReady = useRef(false);

  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      try {
        const { data: article } = await articleApi.getOne(articleId);
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
  }, [articleId, isEdit]);

  const handleContentChange = (json: Record<string, any>) => {
    contentReady.current = true;
    setContent(json);
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
