'use client';

import { useAccount } from '@/components/account/account-provider';
import { SkeletonBlock, SkeletonCard } from '@/components/account/skeleton';
import { Card } from '@asko/ui';
import { PageContainer } from '@/components/account/page-container';
import { PageHeader } from '@/components/account/page-header';

export default function PaymentsPage() {
  const { stage } = useAccount();

  if (stage === 'skeleton') {
    return (
      <PageContainer>
        <SkeletonBlock className="h-8 w-48" />
        <SkeletonCard className="h-[300px]" />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader>Платежи</PageHeader>
      <Card className="text-text-sub">
        Раздел находится в разработке
      </Card>
    </PageContainer>
  );
}
