'use client';

import { useAccount } from '@/components/account/account-provider';
import { useRoleGuard } from '@/hooks/use-role-guard';
import { RepairerManuals } from '@/components/account/repairer/repairer-manuals';
import { SkeletonBlock } from '@/components/skeleton';
import { PageContainer } from '@/components/account/page-container';

function ManualsSkeleton() {
  return (
    <PageContainer>
      <SkeletonBlock className="h-8 w-32" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-36 bg-[#F5F5F5] animate-pulse rounded" />
        ))}
      </div>
    </PageContainer>
  );
}

export default function ManualsPage() {
  const { stage } = useAccount();
  const allowed = useRoleGuard(['repairer']);

  if (!allowed) {
    if (stage === 'skeleton') return <ManualsSkeleton />;
    return null;
  }

  return <RepairerManuals />;
}
