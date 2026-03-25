'use client';

import { useAccount } from '@/components/account/account-provider';
import { useRoleGuard } from '@/hooks/use-role-guard';
import { AdminUsers } from '@/components/account/admin/admin-users';
import { SkeletonBlock, SkeletonCard } from '@/components/account/skeleton';
import { PageContainer } from '@/components/account/page-container';

export default function UsersPage() {
  const { stage } = useAccount();
  const allowed = useRoleGuard(['admin', 'manager']);

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

  return <AdminUsers />;
}
