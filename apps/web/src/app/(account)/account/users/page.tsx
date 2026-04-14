'use client';

import { lazy, Suspense } from 'react';
import { useRoleGuard } from '@/hooks/use-role-guard';
import { AccountPageSkeleton } from '@/components/account/layout/page-skeleton';

const AdminUsers = lazy(() => import('@/components/account/users').then(m => ({ default: m.AdminUsers })));

export default function UsersPage() {
  const allowed = useRoleGuard(['admin', 'manager']);

  if (!allowed) return null;

  return <Suspense fallback={<AccountPageSkeleton />}><AdminUsers /></Suspense>;
}
