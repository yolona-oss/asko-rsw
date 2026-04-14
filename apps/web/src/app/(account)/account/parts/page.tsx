'use client';

import { lazy, Suspense } from 'react';
import { useRoleGuard } from '@/hooks/use-role-guard';
import { AccountPageSkeleton } from '@/components/account/layout/page-skeleton';

const PartsPage = lazy(() => import('@/components/account/parts').then(m => ({ default: m.PartsPage })));

export default function AccountPartsPage() {
  const allowed = useRoleGuard(['admin', 'repairer']);

  if (!allowed) return null;

  return <Suspense fallback={<AccountPageSkeleton />}><PartsPage /></Suspense>;
}
