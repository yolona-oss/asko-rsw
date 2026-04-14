'use client';

import { lazy, Suspense } from 'react';
import { useAccount } from '@/components/account/layout/provider';
import { useRoleGuard } from '@/hooks/use-role-guard';
import { primaryRole } from '@/lib/account';
import { AccountPageSkeleton } from '@/components/account/layout/page-skeleton';

const UserCertificates = lazy(() => import('@/components/account/certificates/user').then(m => ({ default: m.UserCertificates })));
const DealerCertificates = lazy(() => import('@/components/account/certificates/dealer').then(m => ({ default: m.DealerCertificates })));

export default function CertificatesPage() {
  const { user } = useAccount();
  const allowed = useRoleGuard(['user', 'dealer']);

  if (!allowed) return null;

  const content = user && primaryRole(user) === 'dealer'
    ? <DealerCertificates />
    : <UserCertificates />;

  return <Suspense fallback={<AccountPageSkeleton />}>{content}</Suspense>;
}
