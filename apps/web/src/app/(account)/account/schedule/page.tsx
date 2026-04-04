'use client';

import { useAccount } from '@/components/account/account-provider';
import { primaryRole } from '@/lib/account';
import { SchedulePage } from '@/components/account/schedule/schedule-page';
import { MySchedulePage } from '@/components/account/schedule/my-schedule-page';

export default function SchedulePageRoute() {
  const { user } = useAccount();
  const role = user ? primaryRole(user) : 'user';

  // Repairers see their own schedule directly
  if (role === 'repairer') {
    return <MySchedulePage />;
  }

  // Managers and admins see the list of all schedules
  return <SchedulePage />;
}
