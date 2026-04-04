'use client';

import { use } from 'react';
import { useAccount } from '@/components/account/account-provider';
import { primaryRole } from '@/lib/account';
import { MySchedulePage } from '@/components/account/schedule/my-schedule-page';

export default function UserScheduleRoute({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = use(params);
  const { user } = useAccount();
  const role = user ? primaryRole(user) : 'user';
  const canApprove = role === 'admin' || role === 'manager';
  const canEdit = canApprove;

  return (
    <MySchedulePage
      targetUserId={userId}
      canEdit={canEdit}
      canApprove={canApprove}
    />
  );
}
