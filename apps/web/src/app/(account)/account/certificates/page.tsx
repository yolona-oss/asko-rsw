'use client';

import { useAccount } from '@/components/account/account-provider';
import { useRoleGuard } from '@/hooks/use-role-guard';
import { UserCertificates } from '@/components/account/user/user-certificates';
import { SkeletonBlock, SkeletonCard } from '@/components/account/skeleton';
import { PageContainer } from '@/components/account/page-container';

export default function CertificatesPage() {
  const { stage } = useAccount();
  const allowed = useRoleGuard(['user', 'dealer']);

  if (!allowed) {
    if (stage === 'skeleton') {
      return (
        <PageContainer>
          <SkeletonBlock className="h-8 w-64" />
          <div className="flex gap-4">
            <SkeletonCard className="h-14 w-40" />
            <SkeletonCard className="h-14 w-40" />
            <SkeletonCard className="h-14 w-40" />
          </div>
          <SkeletonCard className="h-[400px]" />
        </PageContainer>
      );
    }
    return null;
  }

  return <UserCertificates />;
}
