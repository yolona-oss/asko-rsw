'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  Button,
  Modal,
  DataGrid,
  DataToolbar,
  VIEW_TABLE,
  VIEW_CARD,
  Pagination,
} from '@asko/ui';
import type { DataGridColumn, SortOrder } from '@asko/ui';
import { PageContainer } from '@/components/account/page-container';
import { PageHeader } from '@/components/account/page-header';
import { articleApi } from '@/lib/api/article';
import type { IArticle } from '@/lib/api/types';
import { ArticleCard } from './article-card';

const PAGE_SIZE = 20;

export function AdminArticles() {
  const [articles, setArticles] = useState<IArticle[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showDeleteAll, setShowDeleteAll] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);
  const [view, setView] = useState('table');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder | null>(null);

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await articleApi.getAll({ page: page, limit: PAGE_SIZE, sortBy: sortBy ?? undefined, sortOrder: sortOrder ?? undefined });
      setArticles(data.data ?? []);
      setTotal(data.overallCount ?? 0);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [page, sortBy, sortOrder]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  const handleDelete = async (id: string) => {
    try {
      await articleApi.delete(id);
      setArticles((prev) => prev.filter((a) => a.id !== id));
    } catch {
    }
  };

  const handleDeleteAll = async () => {
    setDeletingAll(true);
    try {
      await articleApi.deleteAll();
      setArticles([]);
    } catch {
    } finally {
      setDeletingAll(false);
      setShowDeleteAll(false);
    }
  };

  // Reset page when search changes
  useEffect(() => {
    setPage(1);
  }, [search]);

  const filteredArticles = useMemo(() => {
    if (!search) return articles;
    const q = search.toLowerCase();
    return articles.filter((a) =>
      a.title.toLowerCase().includes(q)
      || a.slug.toLowerCase().includes(q)
      || a.tags?.some((t) => t.toLowerCase().includes(q)),
    );
  }, [articles, search]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const columns: DataGridColumn<IArticle>[] = useMemo(() => [
    {
      key: 'title',
      header: 'Название',
      mobileLabel: 'Название:',
      render: (article) => <p className="text-sm font-medium text-text-main">{article.title}</p>,
    },
    {
      key: 'slug',
      header: 'Slug',
      width: 192,
      mobileLabel: 'Slug:',
      render: (article) => <p className="text-sm text-text-sub">{article.slug}</p>,
    },
    {
      key: 'tags',
      header: 'Теги',
      width: 192,
      multiline: true,
      mobileLabel: 'Теги:',
      render: (article) => (
        <div className="flex flex-wrap gap-1">
          {article.tags?.map((tag) => (
            <span key={tag} className="px-2 py-0.5 text-xs bg-gray-100 text-text-sub rounded-sm">
              {tag}
            </span>
          ))}
        </div>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: 200,
      sortable: false,
      render: (article) => (
        <div className="flex gap-2">
          <Link href={`/account/articles/${article.id}`}>
            <Button variant="secondary" size="sm">Изменить</Button>
          </Link>
          <Button variant="danger" size="sm" onClick={() => handleDelete(article.id)}>Удалить</Button>
        </div>
      ),
    },
  ], []);

  return (
    <PageContainer>
      <PageHeader>Статьи</PageHeader>

      {/* Toolbar */}
      <DataToolbar
        search={{ value: search, onChange: setSearch, placeholder: "Поиск" }}
        views={[VIEW_TABLE, VIEW_CARD]}
        activeView={view}
        onViewChange={setView}
        actions={<>
          <Link href="/account/articles/graph">
            <Button variant="secondary" size="sm">Граф связей</Button>
          </Link>
          <Link href="/account/articles/create">
            <Button size="sm">Добавить статью</Button>
          </Link>
          {articles.length > 0 && (
            <Button variant="danger" size="sm" onClick={() => setShowDeleteAll(true)}>
              Удалить все
            </Button>
          )}
        </>}
      />

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
        <DataGrid
          columns={columns}
          data={filteredArticles}
          keyExtractor={(article) => article.id}
          emptyContent="Нет статей"
          sortKey={sortBy ?? undefined}
          sortOrder={sortOrder ?? undefined}
          onSort={(key, order) => { setSortBy(key); setSortOrder(order); setPage(1); }}
          footer={
            <div className="flex items-center justify-between w-full">
              <span>Показано {filteredArticles.length} из {total}</span>
              <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
          }
        />
      ) : (
        <>
          {filteredArticles.length === 0 ? (
            <p className="text-sm text-text-sub text-center py-8">Нет статей</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredArticles.map((article) => (
                <ArticleCard
                  key={article.id}
                  article={article}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} className="justify-center mt-6" />
        </>
      )}
    </PageContainer>
  );
}
