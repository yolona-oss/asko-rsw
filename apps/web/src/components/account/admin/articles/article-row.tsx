'use client';

import Link from 'next/link';
import {
  Button,
  DataTableRow,
  DataTableCell,
} from '@asko/ui';
import type { IArticle } from '@/lib/api/types';

export function ArticleRow({
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
