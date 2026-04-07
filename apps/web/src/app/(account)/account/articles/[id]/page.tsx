'use client';

import { useParams } from 'next/navigation';
import { useRoleGuard } from '@/hooks/use-role-guard';
import { AdminArticleForm } from '@/components/account/admin/article-form';

export default function ArticleEditPage() {
  const { id } = useParams<{ id: string }>();
  const allowed = useRoleGuard(['admin']);

  if (!allowed) return null;

  return <AdminArticleForm articleId={id} />;
}
