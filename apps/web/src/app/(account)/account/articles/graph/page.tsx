'use client';

import { useRoleGuard } from '@/hooks/use-role-guard';
import { PageContainer } from '@/components/account/layout/page-container';
import { PageHeader } from '@/components/account/layout/page-header';
import { ArticleGraph } from '@/components/account/admin/article-graph/article-graph';

export default function ArticleGraphPage() {
  const allowed = useRoleGuard(['admin']);

  if (!allowed) return null;

  return (
    <PageContainer>
      <PageHeader>Граф связей статей</PageHeader>
      <ArticleGraph />
    </PageContainer>
  );
}
