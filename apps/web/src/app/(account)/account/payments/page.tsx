'use client';

import { lazy, Suspense } from 'react';
import { useAccount } from '@/components/account/layout/provider';
import { primaryRole } from '@/lib/account';
import { AccountPageSkeleton } from '@/components/account/layout/page-skeleton';

const ManagerPayments = lazy(() => import('@/components/account/manager/payments').then(m => ({ default: m.ManagerPayments })));
const DealerPayments = lazy(() => import('@/components/account/dealer/payments').then(m => ({ default: m.DealerPayments })));
const UserPayments = lazy(() => import('@/components/account/user/payments').then(m => ({ default: m.UserPayments })));

export default function PaymentsPage() {
  const { user } = useAccount();

  if (!user) return null;

  const role = primaryRole(user);

  const content = (() => {
    switch (role) {
      case 'admin':
      case 'manager':
        return <ManagerPayments />;
      case 'dealer':
        return <DealerPayments />;
      default:
        return <UserPayments />;
    }
  })();

  return <Suspense fallback={<AccountPageSkeleton />}>{content}</Suspense>;
}
