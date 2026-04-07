'use client';

import { lazy, Suspense, use } from 'react';
import { useAccount } from '@/components/account/layout/provider';
import { primaryRole } from '@/lib/account';
import { AccountPageSkeleton } from '@/components/account/layout/page-skeleton';

const MySchedulePage = lazy(() => import('@/components/account/schedule/my-schedule-page').then(m => ({ default: m.MySchedulePage })));

export default function UserScheduleRoute({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = use(params);
  const { user } = useAccount();
  const role = user ? primaryRole(user) : 'user';
  const canApprove = role === 'admin' || role === 'manager';
  const canEdit = canApprove;

  return (
    <Suspense fallback={<AccountPageSkeleton />}>
      <MySchedulePage
        targetUserId={userId}
        canEdit={canEdit}
        canApprove={canApprove}
      />
    </Suspense>
  );
}
