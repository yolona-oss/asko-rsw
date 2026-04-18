'use client';

import { lazy, Suspense } from 'react';
import { useRoleGuard } from '@/hooks/use-role-guard';
import { ProfilePageSkeleton } from '@/components/account/layout/page-skeleton';

const ProfileForm = lazy(() => import('@/components/account/profile').then(m => ({ default: m.ProfileForm })));

export default function ProfilePage() {
  const allowed = useRoleGuard(['user', 'dealer', 'admin', 'repairer', 'manager']);

  if (!allowed) return null;

  return <Suspense fallback={<ProfilePageSkeleton />}><ProfileForm /></Suspense>;
}
