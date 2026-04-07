'use client';

import { lazy, Suspense } from 'react';
import { useRoleGuard } from '@/hooks/use-role-guard';
import { AccountPageSkeleton } from '@/components/account/layout/page-skeleton';

const AdminDeviceCategories = lazy(() => import('@/components/account/admin/device-categories/admin-device-categories').then(m => ({ default: m.AdminDeviceCategories })));

export default function DeviceCategoriesPage() {
  const allowed = useRoleGuard(['admin']);

  if (!allowed) return null;

  return <Suspense fallback={<AccountPageSkeleton />}><AdminDeviceCategories /></Suspense>;
}
