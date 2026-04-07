'use client';

import { useAccount } from '@/components/account/account-provider';
import { primaryRole } from '@/lib/account';
import { ManagerRequests } from '@/components/account/manager/manager-requests';
import { RepairerRequest } from '@/components/account/repairer/repairer-request';
import { UserRequests } from '@/components/account/user/user-requests';

export default function RequestsPage() {
  const { user } = useAccount();

  if (!user) return null;

  if (primaryRole(user) === 'manager') {
    return <ManagerRequests />;
  }

  if (primaryRole(user) === 'repairer') {
    return <RepairerRequest />;
  }

  return <UserRequests />;
}
