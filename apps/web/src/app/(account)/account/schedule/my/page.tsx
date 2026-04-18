'use client';

import { lazy, Suspense } from 'react';
import { MySchedulePageSkeleton } from '@/components/account/layout/page-skeleton';

const MySchedulePage = lazy(() => import('@/components/account/schedule/my-schedule-page').then(m => ({ default: m.MySchedulePage })));

export default function MyScheduleRoute() {
  return <Suspense fallback={<MySchedulePageSkeleton />}><MySchedulePage /></Suspense>;
}
