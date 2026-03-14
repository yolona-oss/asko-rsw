'use client';

import { use } from 'react';
import { useAccount } from '@/components/account/account-provider';
import { useRoleGuard } from '@/hooks/use-role-guard';
import { RepairerManualDetail } from '@/components/account/repairer/repairer-manual-detail';
import { SkeletonBlock } from '@/components/account/skeleton';
import { PageContainer } from '@/components/account/page-container';

function DetailSkeleton() {
  return (
    <PageContainer>
      <SkeletonBlock className="h-8 w-64" />
      <div className="h-64 bg-[#F5F5F5] animate-pulse rounded" />
    </PageContainer>
  );
}

export default function ManualDetailPage({ params }: { params: Promise<{ deviceId: string }> }) {
  const { deviceId } = use(params);
  const { stage } = useAccount();
  const allowed = useRoleGuard(['repairer']);

  if (!allowed) {
    if (stage === 'skeleton') return <DetailSkeleton />;
    return null;
  }

  return <RepairerManualDetail deviceId={deviceId} />;
}
