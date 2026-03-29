'use client';

import { useAccount } from '@/components/account/account-provider';
import { useRoleGuard } from '@/hooks/use-role-guard';
import { PageContainer } from '@/components/account/page-container';
import { PageHeader } from '@/components/account/page-header';
import { SkeletonBlock, SkeletonCard } from '@/components/account/skeleton';
import { ArticleGraph } from '@/components/account/admin/article-graph/article-graph';

export default function ArticleGraphPage() {
  const { stage } = useAccount();
  const allowed = useRoleGuard(['admin']);

  if (!allowed) {
    if (stage === 'skeleton') {
      return (
        <PageContainer>
          <SkeletonBlock className="h-8 w-64" />
          <SkeletonCard className="h-[500px]" />
        </PageContainer>
      );
    }
    return null;
  }

  return (
    <PageContainer>
      <PageHeader>Граф связей статей</PageHeader>
      <ArticleGraph />
    </PageContainer>
  );
}
