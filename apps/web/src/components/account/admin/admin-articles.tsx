'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Button,
  Modal,
  DataTable,
  DataTableHeader,
  DataTableRow,
  DataTableCell,
  ViewSwitcher,
  VIEW_TABLE,
  VIEW_CARD,
} from '@asko/ui';
import { PageContainer } from '@/components/account/page-container';
import { PageHeader } from '@/components/account/page-header';
import { articleApi } from '@/lib/api/article';
import type { IArticle } from '@/lib/api/types';

function ArticleRow({
  article,
  onDelete,
}: {
  article: IArticle;
  onDelete: (id: string) => void;
}) {
  return (
    <DataTableRow>
      <DataTableCell mobileLabel="Название:" className="lg:flex-1">
        <p className="text-sm font-medium text-text-main">{article.title}</p>
      </DataTableCell>
      <DataTableCell mobileLabel="Slug:" className="lg:w-48 lg:px-4">
        <p className="text-sm text-text-sub">{article.slug}</p>
      </DataTableCell>
      <DataTableCell mobileLabel="Теги:" className="lg:w-48 lg:px-4">
        <div className="flex flex-wrap gap-1">
          {article.tags?.map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 text-xs bg-gray-100 text-text-sub rounded-sm"
            >
              {tag}
            </span>
          ))}
        </div>
      </DataTableCell>
      <DataTableCell className="lg:w-[200px] lg:flex-shrink-0 lg:text-right flex gap-2">
        <Link href={`/account/articles/${article.id}`}>
          <Button variant="secondary" size="sm">
            Изменить
          </Button>
        </Link>
        <Button variant="danger" size="sm" onClick={() => onDelete(article.id)}>
          Удалить
        </Button>
      </DataTableCell>
    </DataTableRow>
  );
}

function ArticleCard({
  article,
  onDelete,
}: {
  article: IArticle;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="bg-white border border-border-light rounded-sm p-5 flex flex-col gap-3">
      <p className="text-sm font-medium text-text-main">{article.title}</p>
      <p className="text-xs text-text-sub">{article.slug}</p>
      {article.tags && article.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {article.tags.map((tag) => (
            <span key={tag} className="px-2 py-0.5 text-xs bg-gray-100 text-text-sub rounded-sm">{tag}</span>
          ))}
        </div>
      )}
      <div className="flex gap-2 pt-1">
        <Link href={`/account/articles/${article.id}`}>
          <Button variant="secondary" size="sm">Изменить</Button>
        </Link>
        <Button variant="danger" size="sm" onClick={() => onDelete(article.id)}>Удалить</Button>
      </div>
    </div>
  );
}

export function AdminArticles() {
  const [articles, setArticles] = useState<IArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteAll, setShowDeleteAll] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);
  const [view, setView] = useState('table');

  const fetchArticles = async () => {
    try {
      const { data } = await articleApi.getAll({ limit: 100 });
      setArticles(data.data ?? []);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await articleApi.delete(id);
      setArticles((prev) => prev.filter((a) => a.id !== id));
    } catch {
      // silently fail
    }
  };

  const handleDeleteAll = async () => {
    setDeletingAll(true);
    try {
      await articleApi.deleteAll();
      setArticles([]);
    } catch {
      // silently fail
    } finally {
      setDeletingAll(false);
      setShowDeleteAll(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader>Статьи</PageHeader>

      <ViewSwitcher
        views={[VIEW_TABLE, VIEW_CARD]}
        activeView={view}
        onViewChange={setView}
      />

      <div className="flex items-start gap-2">
        <Link
          href="/account/articles/create"
          className="m-2 px-5 py-2.5 text-sm font-medium text-white bg-brand-red rounded-sm cursor-pointer"
        >
          Добавить статью
        </Link>
        {articles.length > 0 && (
          <Button
            variant="danger"
            size="sm"
            className="m-2"
            onClick={() => setShowDeleteAll(true)}
          >
            Удалить все
          </Button>
        )}
      </div>

      <Modal
        open={showDeleteAll}
        onClose={deletingAll ? undefined : () => setShowDeleteAll(false)}
        className="w-full max-w-sm p-6"
      >
        <h2 className="text-base font-medium text-text-main mb-2">
          Удалить все статьи?
        </h2>
        <p className="text-sm text-text-sub mb-6">
          Это действие удалит все {articles.length} статей. Отменить будет
          невозможно.
        </p>
        <div className="flex justify-end gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowDeleteAll(false)}
            disabled={deletingAll}
          >
            Отмена
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={handleDeleteAll}
            disabled={deletingAll}
          >
            {deletingAll ? 'Удаление...' : 'Удалить все'}
          </Button>
        </div>
      </Modal>

      {loading ? (
        <p className="text-sm text-text-sub p-4">Загрузка...</p>
      ) : view === 'table' ? (
        <>
          <DataTableHeader>
            <div className="flex-1">Название</div>
            <div className="w-48 px-4">Slug</div>
            <div className="w-48 px-4">Теги</div>
            <div className="w-[200px] flex-shrink-0" />
          </DataTableHeader>

          <DataTable>
            {articles.map((article) => (
              <ArticleRow
                key={article.id}
                article={article}
                onDelete={handleDelete}
              />
            ))}
          </DataTable>
        </>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {articles.map((article) => (
            <ArticleCard
              key={article.id}
              article={article}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </PageContainer>
  );
}
