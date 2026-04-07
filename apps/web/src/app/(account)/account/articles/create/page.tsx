'use client';

import { lazy, Suspense } from 'react';
import { useRoleGuard } from '@/hooks/use-role-guard';
import { FormPageSkeleton } from '@/components/account/layout/page-skeleton';

const AdminArticleForm = lazy(() => import('@/components/account/admin/article-form').then(m => ({ default: m.AdminArticleForm })));

export default function ArticleCreatePage() {
  const allowed = useRoleGuard(['admin']);

  if (!allowed) return null;

  return <Suspense fallback={<FormPageSkeleton />}><AdminArticleForm /></Suspense>;
}
