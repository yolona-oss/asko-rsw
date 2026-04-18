'use client';

import { lazy, Suspense } from 'react';
import { useParams } from 'next/navigation';
import { useAccount } from '@/components/account/layout/provider';
import { primaryRole } from '@/lib/account';
import { DetailPageSkeleton } from '@/components/account/layout/page-skeleton';

const UserRequestStatus = lazy(() => import('@/components/account/requests/user').then(m => ({ default: m.UserRequestStatus })));
const ManagerRequestDetail = lazy(() => import('@/components/account/requests/manager').then(m => ({ default: m.ManagerRequestDetail })));
const RepairerRequestDetail = lazy(() => import('@/components/account/requests/repairer').then(m => ({ default: m.RepairerRequestDetail })));

export default function RequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAccount();

  if (!user) return null;

  const content = (() => {
    if (primaryRole(user) === 'manager') {
      return <ManagerRequestDetail requestId={id} />;
    }

    if (primaryRole(user) === 'repairer') {
      return <RepairerRequestDetail requestId={id} />;
    }

    return <UserRequestStatus requestId={id} />;
  })();

  return <Suspense fallback={<DetailPageSkeleton />}>{content}</Suspense>;
}
