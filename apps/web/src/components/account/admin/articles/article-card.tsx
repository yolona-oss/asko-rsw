'use client';

import { useRouter } from 'next/navigation';
import { Card, ContextMenuArea } from '@asko/ui';
import type { DropdownMenuEntry } from '@asko/ui';
import type { IArticle } from '@/lib/api/types';

export function ArticleCard({
  article,
  onDelete,
}: {
  article: IArticle;
  onDelete: (id: string) => void;
}) {
  const router = useRouter();

  const menuItems: DropdownMenuEntry[] = [
    { key: 'edit', label: 'Изменить', onClick: () => router.push(`/account/articles/${article.id}`) },
    { key: 'delete', label: 'Удалить', variant: 'danger', onClick: () => onDelete(article.id) },
  ];

  return (
    <ContextMenuArea items={menuItems}>
      <Card padding="none" className="p-5 flex flex-col gap-3">
        <p className="text-sm font-medium text-text-main">{article.title}</p>
        <p className="text-sm text-text-sub">{article.slug}</p>
        {article.tags && article.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {article.tags.map((tag) => (
              <span key={tag} className="px-2 py-0.5 text-xs bg-gray-100 text-text-sub">{tag}</span>
            ))}
          </div>
        )}
      </Card>
    </ContextMenuArea>
  );
}
