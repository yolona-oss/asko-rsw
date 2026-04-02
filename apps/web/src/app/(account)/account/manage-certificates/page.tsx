'use client';

import { useAccount } from '@/components/account/account-provider';
import { useRoleGuard } from '@/hooks/use-role-guard';
import { AdminCertificates } from '@/components/account/admin/admin-certificates';
import { SkeletonBlock, SkeletonCard } from '@/components/skeleton';
import { PageContainer } from '@/components/account/page-container';

export default function ManageCertificatesPage() {
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

  return <AdminCertificates />;
}
