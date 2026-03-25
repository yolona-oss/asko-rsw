'use client';

import { useParams } from 'next/navigation';
import { useAccount } from '@/components/account/account-provider';
import { primaryRole } from '@/lib/account';
import { UserRequestStatus } from '@/components/account/user/user-request-status';
import { ManagerRequestDetail } from '@/components/account/manager/manager-request-detail';
import { RepairerRequestDetail } from '@/components/account/repairer/repairer-request-detail';
import { SkeletonBlock, SkeletonCard } from '@/components/account/skeleton';
import { PageContainer } from '@/components/account/page-container';

export default function RequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { stage, user } = useAccount();

  if (stage === 'skeleton' || !user) {
    return (
      <PageContainer>
        <SkeletonBlock className="h-8 w-64" />
        <SkeletonCard className="h-[400px]" />
      </PageContainer>
    );
  }

  if (primaryRole(user) === 'manager') {
    return <ManagerRequestDetail requestId={id} />;
  }

  if (primaryRole(user) === 'repairer') {
    return <RepairerRequestDetail requestId={id} />;
  }

  return <UserRequestStatus requestId={id} />;
}
