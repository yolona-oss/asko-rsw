'use client';

import { useAccount } from '@/components/account/account-provider';
import { useRoleGuard } from '@/hooks/use-role-guard';
import { ManagerAccess } from '@/components/account/manager/manager-access';
import { SkeletonBlock, SkeletonCard } from '@/components/account/skeleton';
import { PageContainer } from '@/components/account/page-container';

export default function AccessPage() {
  const { stage } = useAccount();
  const allowed = useRoleGuard(['manager', 'admin']);

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

  return <ManagerAccess />;
}
