'use client';

import { lazy, Suspense, use } from 'react';
import { useRoleGuard } from '@/hooks/use-role-guard';
import { AccountPageSkeleton } from '@/components/account/layout/page-skeleton';

const RepairerManualDetail = lazy(() => import('@/components/account/manuals/repairer-manual-detail').then(m => ({ default: m.RepairerManualDetail })));

export default function ManualDetailPage({ params }: { params: Promise<{ deviceId: string }> }) {
  const { deviceId } = use(params);
  const allowed = useRoleGuard(['repairer']);

  if (!allowed) return null;

  return <Suspense fallback={<AccountPageSkeleton />}><RepairerManualDetail deviceId={deviceId} /></Suspense>;
}
