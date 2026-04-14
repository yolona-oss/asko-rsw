'use client';

import { lazy, Suspense } from 'react';
import { useParams } from 'next/navigation';
import { useRoleGuard } from '@/hooks/use-role-guard';
import { FormPageSkeleton } from '@/components/account/layout/page-skeleton';

const AdminArticleForm = lazy(() => import('@/components/account/articles/form').then(m => ({ default: m.AdminArticleForm })));

export default function ArticleEditPage() {
  const { id } = useParams<{ id: string }>();
  const allowed = useRoleGuard(['admin']);

  if (!allowed) return null;

  return <Suspense fallback={<FormPageSkeleton />}><AdminArticleForm articleId={id} /></Suspense>;
}
