'use client';

import { lazy, Suspense } from 'react';
import { useRoleGuard } from '@/hooks/use-role-guard';
import { PageContainer } from '@/components/account/layout/page-container';
import { PageHeader } from '@/components/account/layout/page-header';
import { AccountPageSkeleton } from '@/components/account/layout/page-skeleton';

const ArticleGraph = lazy(() => import('@/components/account/admin/article-graph/article-graph').then(m => ({ default: m.ArticleGraph })));

export default function ArticleGraphPage() {
  const allowed = useRoleGuard(['admin']);

  if (!allowed) return null;

  return (
    <PageContainer>
      <PageHeader>Граф связей статей</PageHeader>
      <Suspense fallback={<AccountPageSkeleton />}>
        <ArticleGraph />
      </Suspense>
    </PageContainer>
  );
}
