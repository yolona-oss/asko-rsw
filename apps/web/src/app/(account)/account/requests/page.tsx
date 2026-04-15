'use client';

import { lazy, Suspense } from 'react';
import { useAccount } from '@/components/account/layout/provider';
import { primaryRole } from '@/lib/account';
import { AccountPageSkeleton } from '@/components/account/layout/page-skeleton';

const ManagerRequests = lazy(() => import('@/components/account/requests/manager').then(m => ({ default: m.ManagerRequests })));
const RepairerRequest = lazy(() => import('@/components/account/requests/repairer').then(m => ({ default: m.RepairerRequest })));
const UserRequests = lazy(() => import('@/components/account/requests/user').then(m => ({ default: m.UserRequests })));

export default function RequestsPage() {
  const { user } = useAccount();

  if (!user) return null;

  const content = (() => {
    if (primaryRole(user) === 'manager') {
      return <ManagerRequests />;
    }

    if (primaryRole(user) === 'repairer') {
      return <RepairerRequest />;
    }

    return <UserRequests />;
  })();

  return <Suspense fallback={<AccountPageSkeleton />}>{content}</Suspense>;
}
