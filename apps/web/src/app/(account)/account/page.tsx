'use client';

import { useAccount } from '@/components/account/account-provider';
import { primaryRole } from '@/lib/account';
import { UserDashboard } from '@/components/account/user/user-dashboard';
import { DealerDashboard } from '@/components/account/dealer/dealer-dashboard';
import { ManagerDashboard } from '@/components/account/manager/manager-dashboard';
import { AdminDashboard } from '@/components/account/admin/admin-dashboard';
import { SkeletonBlock, SkeletonCard } from '@/components/account/skeleton';
import { PageContainer } from '@/components/account/page-container';

function DashboardSkeleton() {
  return (
    <PageContainer>
      <div className="flex flex-col gap-2">
        <SkeletonBlock className="h-8 w-[340px]" />
        <SkeletonBlock className="h-5 w-[180px]" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        <SkeletonCard className="h-[180px] lg:h-[200px]" />
        <SkeletonCard className="h-[180px] lg:h-[200px]" />
        <SkeletonCard className="h-[180px] lg:h-[200px]" />
      </div>
    </PageContainer>
  );
}

export default function AccountDashboardPage() {
  const { stage, user } = useAccount();

  if (stage === 'skeleton' || !user) {
    return <DashboardSkeleton />;
  }

  switch (primaryRole(user)) {
    case 'admin':
      return <AdminDashboard />;
    case 'dealer':
      return <DealerDashboard />;
    case 'manager':
      return <ManagerDashboard />;
    default:
      return <UserDashboard />;
  }
}
