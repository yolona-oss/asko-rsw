'use client';

import { useParams } from 'next/navigation';
import { useAccount } from '@/components/account/account-provider';
import { UserRequestStatus } from '@/components/account/user/user-request-status';
import { ManagerRequestDetail } from '@/components/account/manager/manager-request-detail';
import { SkeletonBlock, SkeletonCard } from '@/components/account/skeleton';

export default function RequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { stage, user } = useAccount();

  if (stage === 'skeleton' || !user) {
    return (
      <div className="p-4 lg:p-8 flex flex-col gap-6">
        <SkeletonBlock className="h-8 w-64" />
        <SkeletonCard className="h-[400px]" />
      </div>
    );
  }

  if (user.role === 'manager') {
    return <ManagerRequestDetail requestId={id} />;
  }

  return <UserRequestStatus requestId={id} />;
}
