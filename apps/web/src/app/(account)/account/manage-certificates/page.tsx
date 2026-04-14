'use client';

import { lazy, Suspense } from 'react';
import { useRoleGuard } from '@/hooks/use-role-guard';
import { AccountPageSkeleton } from '@/components/account/layout/page-skeleton';

const AdminCertificates = lazy(() => import('@/components/account/certificates/admin').then(m => ({ default: m.AdminCertificates })));

export default function ManageCertificatesPage() {
  const allowed = useRoleGuard(['admin']);

  if (!allowed) return null;

  return <Suspense fallback={<AccountPageSkeleton />}><AdminCertificates /></Suspense>;
}
