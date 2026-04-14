'use client';

import { lazy, Suspense } from 'react';
import { useRoleGuard } from '@/hooks/use-role-guard';
import { FormPageSkeleton } from '@/components/account/layout/page-skeleton';

const AdminDeviceForm = lazy(() => import('@/components/account/devices/form').then(m => ({ default: m.AdminDeviceForm })));

export default function DeviceCreatePage() {
  const allowed = useRoleGuard(['admin']);

  if (!allowed) return null;

  return <Suspense fallback={<FormPageSkeleton />}><AdminDeviceForm /></Suspense>;
}
