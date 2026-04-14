'use client';

import { lazy, Suspense } from 'react';
import { useRoleGuard } from '@/hooks/use-role-guard';
import { AccountPageSkeleton } from '@/components/account/layout/page-skeleton';

const RepairerHistory = lazy(() => import('@/components/account/history').then(m => ({ default: m.RepairerHistory })));

export default function HistoryPage() {
  const allowed = useRoleGuard(['repairer']);

  if (!allowed) return null;

  return <Suspense fallback={<AccountPageSkeleton />}><RepairerHistory /></Suspense>;
}
