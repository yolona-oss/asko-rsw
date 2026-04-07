'use client';

import { lazy, Suspense } from 'react';
import { useRoleGuard } from '@/hooks/use-role-guard';
import { Card } from '@asko/ui';
import { PageContainer } from '@/components/account/layout/page-container';
import { PageHeader } from '@/components/account/layout/page-header';
import { FormPageSkeleton } from '@/components/account/layout/page-skeleton';

const ProfileForm = lazy(() => import('@/components/account/profile').then(m => ({ default: m.ProfileForm })));

export default function ProfilePage() {
  const allowed = useRoleGuard(['user', 'dealer', 'admin', 'repairer', 'manager']);

  if (!allowed) return null;

  return (
    <PageContainer>
      <PageHeader>Профиль</PageHeader>
      <Card>
        <Suspense fallback={<FormPageSkeleton />}>
          <ProfileForm />
        </Suspense>
      </Card>
    </PageContainer>
  );
}
