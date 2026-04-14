'use client';

import { lazy, Suspense } from 'react';
import { useRoleGuard } from '@/hooks/use-role-guard';
import { AccountPageSkeleton } from '@/components/account/layout/page-skeleton';

const AdminDevices = lazy(() => import('@/components/account/devices').then(m => ({ default: m.AdminDevices })));

export default function DevicesPage() {
  const allowed = useRoleGuard(['admin']);

  if (!allowed) return null;

  return <Suspense fallback={<AccountPageSkeleton />}><AdminDevices /></Suspense>;
}
