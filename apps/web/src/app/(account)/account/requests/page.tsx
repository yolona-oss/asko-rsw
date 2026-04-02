'use client';

import { useAccount } from '@/components/account/account-provider';
import { primaryRole } from '@/lib/account';
import { ManagerRequests } from '@/components/account/manager/manager-requests';
import { RepairerRequest } from '@/components/account/repairer/repairer-request';
import { UserRequests } from '@/components/account/user/user-requests';
import { SkeletonBlock, SkeletonCard } from '@/components/skeleton';
import { PageContainer } from '@/components/account/page-container';

export default function RequestsPage() {
  const { stage, user } = useAccount();

  if (stage === 'skeleton' || !user) {
    return (
      <PageContainer>
        <SkeletonBlock className="h-8 w-72" />
        <div className="flex gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} className="h-10 w-28" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {Array.from({ length: 9 }).map((_, i) => (
            <SkeletonCard key={i} className="h-[200px]" />
          ))}
        </div>
      </PageContainer>
    );
  }

  if (primaryRole(user) === 'manager') {
    return <ManagerRequests />;
  }

  if (primaryRole(user) === 'repairer') {
    return <RepairerRequest />;
  }

  return <UserRequests />;
}
