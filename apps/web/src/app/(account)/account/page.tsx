'use client';

import { useAccount } from '@/components/account/account-provider';
import { primaryRole } from '@/lib/account';
import { UserDashboard } from '@/components/account/user/user-dashboard';
import { DealerDashboard } from '@/components/account/dealer/dealer-dashboard';
import { ManagerDashboard } from '@/components/account/manager/manager-dashboard';
import { SkeletonBlock, SkeletonCard } from '@/components/account/skeleton';

function DashboardSkeleton() {
  return (
    <div className="p-4 lg:p-8 flex flex-col gap-6 lg:gap-8">
      <div className="flex flex-col gap-2">
        <SkeletonBlock className="h-8 w-[340px]" />
        <SkeletonBlock className="h-5 w-[180px]" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        <SkeletonCard className="h-[180px] lg:h-[200px]" />
        <SkeletonCard className="h-[180px] lg:h-[200px]" />
        <SkeletonCard className="h-[180px] lg:h-[200px]" />
      </div>
    </div>
  );
}

export default function AccountDashboardPage() {
  const { stage, user } = useAccount();

  if (stage === 'skeleton' || !user) {
    return <DashboardSkeleton />;
  }

  switch (primaryRole(user)) {
    case 'dealer':
      return <DealerDashboard />;
    case 'manager':
      return <ManagerDashboard />;
    default:
      return <UserDashboard />;
  }
}
