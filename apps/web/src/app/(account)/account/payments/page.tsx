'use client';

import { useAccount } from '@/components/account/account-provider';
import { primaryRole } from '@/lib/account';
import { SkeletonBlock, SkeletonCard } from '@/components/skeleton';
import { PageContainer } from '@/components/account/page-container';
import { ManagerPayments } from '@/components/account/manager/manager-payments';
import { UserPayments } from '@/components/account/user/user-payments';
import { DealerPayments } from '@/components/account/dealer/dealer-payments';

export default function PaymentsPage() {
  const { stage, user } = useAccount();

  if (stage === 'skeleton' || !user) {
    return (
      <PageContainer>
        <SkeletonBlock className="h-8 w-48" />
        <SkeletonCard className="h-[300px]" />
      </PageContainer>
    );
  }

  const role = primaryRole(user);

  switch (role) {
    case 'admin':
    case 'manager':
      return <ManagerPayments />;
    case 'dealer':
      return <DealerPayments />;
    default:
      return <UserPayments />;
  }
}
