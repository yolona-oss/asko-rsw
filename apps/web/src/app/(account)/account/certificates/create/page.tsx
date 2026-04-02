'use client';

import { useAccount } from '@/components/account/account-provider';
import { useRoleGuard } from '@/hooks/use-role-guard';
import { CertificateWizard } from '@/components/account/dealer/certificate-wizard';
import { SkeletonBlock, SkeletonCard } from '@/components/skeleton';
import { PageContainer } from '@/components/account/page-container';

export default function CreateCertificatePage() {
  const { stage } = useAccount();
  const allowed = useRoleGuard(['dealer']);

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

  return <CertificateWizard />;
}
