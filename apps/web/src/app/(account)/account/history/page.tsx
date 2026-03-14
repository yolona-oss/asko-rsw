'use client';

import { useAccount } from '@/components/account/account-provider';
import { useRoleGuard } from '@/hooks/use-role-guard';
import { RepairerHistory } from '@/components/account/repairer/repairer-history';
import { SkeletonBlock, SkeletonCard } from '@/components/account/skeleton';
import { PageContainer } from '@/components/account/page-container';

function HistorySkeleton() {
  return (
    <PageContainer>
      <SkeletonBlock className="h-8 w-48" />
      <SkeletonCard className="h-28" />
      <div className="flex flex-col gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonCard key={i} className="h-20" />
        ))}
      </div>
    </PageContainer>
  );
}

export default function HistoryPage() {
  const { stage } = useAccount();
  const allowed = useRoleGuard(['repairer']);

  if (!allowed) {
    if (stage === 'skeleton') return <HistorySkeleton />;
    return null;
  }

  return <RepairerHistory />;
}
