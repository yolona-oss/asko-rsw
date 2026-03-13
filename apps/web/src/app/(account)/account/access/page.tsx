'use client';

import { useAccount } from '@/components/account/account-provider';
import { useRoleGuard } from '@/hooks/use-role-guard';
import { ManagerAccess } from '@/components/account/manager/manager-access';
import { SkeletonBlock, SkeletonCard } from '@/components/account/skeleton';

export default function AccessPage() {
  const { stage } = useAccount();
  const allowed = useRoleGuard(['manager', 'admin']);

  if (!allowed) {
    if (stage === 'skeleton') {
      return (
        <div className="p-4 lg:p-8 flex flex-col gap-6">
          <SkeletonBlock className="h-8 w-64" />
          <SkeletonCard className="h-[500px]" />
        </div>
      );
    }
    return null;
  }

  return <ManagerAccess />;
}
