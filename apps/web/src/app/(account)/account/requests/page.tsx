'use client';

import { useAccount } from '@/components/account/layout/provider';
import { primaryRole } from '@/lib/account';
import { ManagerRequests } from '@/components/account/manager/requests';
import { RepairerRequest } from '@/components/account/repairer/requests';
import { UserRequests } from '@/components/account/user/requests';

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
