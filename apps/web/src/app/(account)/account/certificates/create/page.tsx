'use client';

import { lazy, Suspense } from 'react';
import { useRoleGuard } from '@/hooks/use-role-guard';
import { FormPageSkeleton } from '@/components/account/layout/page-skeleton';

const CertificateWizard = lazy(() => import('@/components/account/certificates/dealer/wizard').then(m => ({ default: m.CertificateWizard })));

export default function CreateCertificatePage() {
  const allowed = useRoleGuard(['dealer']);

  if (!allowed) return null;

  return <Suspense fallback={<FormPageSkeleton />}><CertificateWizard /></Suspense>;
}
