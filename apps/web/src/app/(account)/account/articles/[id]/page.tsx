'use client';

import { useParams } from 'next/navigation';
import { useAccount } from '@/components/account/account-provider';
import { useRoleGuard } from '@/hooks/use-role-guard';
import { AdminArticleForm } from '@/components/account/admin/admin-article-form';
import { SkeletonBlock, SkeletonCard } from '@/components/skeleton';
import { PageContainer } from '@/components/account/page-container';

export default function ArticleEditPage() {
  const { id } = useParams<{ id: string }>();
  const { stage } = useAccount();
  const allowed = useRoleGuard(['admin']);

  if (!allowed) {
    if (stage === 'skeleton') {
      return (
        <PageContainer>
          <SkeletonBlock className="h-8 w-64" />
          <SkeletonCard className="h-[600px]" />
        </PageContainer>
      );
    }
    return null;
  }

  return <AdminArticleForm articleId={id} />;
}
