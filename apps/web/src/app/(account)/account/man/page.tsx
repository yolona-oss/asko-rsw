'use client';

import { lazy, Suspense } from 'react';
import { useRoleGuard } from '@/hooks/use-role-guard';
import { AccountPageSkeleton } from '@/components/account/layout/page-skeleton';

const RepairerManuals = lazy(() => import('@/components/account/manuals/manuals').then(m => ({ default: m.RepairerManuals })));

export default function ManualsPage() {
  const allowed = useRoleGuard(['repairer']);

  if (!allowed) return null;

  return <Suspense fallback={<AccountPageSkeleton />}><RepairerManuals /></Suspense>;
}
