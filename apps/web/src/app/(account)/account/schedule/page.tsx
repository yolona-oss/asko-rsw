'use client';

import { lazy, Suspense } from 'react';
import { useAccount } from '@/components/account/layout/provider';
import { primaryRole } from '@/lib/account';
import { SchedulePageSkeleton, MySchedulePageSkeleton } from '@/components/account/layout/page-skeleton';

const SchedulePage = lazy(() => import('@/components/account/schedule/schedule-page').then(m => ({ default: m.SchedulePage })));
const MySchedulePage = lazy(() => import('@/components/account/schedule/my-schedule-page').then(m => ({ default: m.MySchedulePage })));

export default function SchedulePageRoute() {
  const { user } = useAccount();
  const role = user ? primaryRole(user) : 'user';

  const content = role === 'repairer'
    ? <MySchedulePage />
    : <SchedulePage />;

  const skeleton = role === 'repairer'
    ? <MySchedulePageSkeleton />
    : <SchedulePageSkeleton />;

  return <Suspense fallback={skeleton}>{content}</Suspense>;
}
