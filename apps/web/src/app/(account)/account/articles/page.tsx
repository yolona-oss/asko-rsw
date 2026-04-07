'use client';

import { lazy, Suspense } from 'react';
import { useRoleGuard } from '@/hooks/use-role-guard';
import { AccountPageSkeleton } from '@/components/account/layout/page-skeleton';

const AdminArticles = lazy(() => import('@/components/account/admin/articles').then(m => ({ default: m.AdminArticles })));

export default function ArticlesPage() {
  const allowed = useRoleGuard(['admin']);

  if (!allowed) return null;

  return <Suspense fallback={<AccountPageSkeleton />}><AdminArticles /></Suspense>;
}
