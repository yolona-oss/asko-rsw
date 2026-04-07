'use client';

import { useRoleGuard } from '@/hooks/use-role-guard';
import { ProfileForm } from '@/components/account/profile';
import { Card } from '@asko/ui';
import { PageContainer } from '@/components/account/layout/page-container';
import { PageHeader } from '@/components/account/layout/page-header';

export default function ProfilePage() {
  const allowed = useRoleGuard(['user', 'dealer', 'admin', 'repairer', 'manager']);

  if (!allowed) return null;

  return (
    <PageContainer>
      <PageHeader>Профиль</PageHeader>
      <Card>
        <ProfileForm />
      </Card>
    </PageContainer>
  );
}
