'use client';

import { useAccount } from '@/components/account/account-provider';
import { useRoleGuard } from '@/hooks/use-role-guard';
import { ProfileForm } from '@/components/account/profile-form';
import { SkeletonBlock, SkeletonCircle } from '@/components/account/skeleton';
import { Card } from '@asko/ui';
import { PageContainer } from '@/components/account/page-container';
import { PageHeader } from '@/components/account/page-header';

function ProfileSkeleton() {
  return (
    <PageContainer>
      <SkeletonBlock className="h-8 w-48" />
      <Card>
        <div className="flex flex-col gap-8">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            <SkeletonCircle className="w-24 h-24 flex-shrink-0" />
            <div className="flex flex-col gap-2 w-full">
              <SkeletonBlock className="h-5 w-40" />
              <SkeletonBlock className="h-20 w-full max-w-md" />
            </div>
          </div>
          <div className="h-px bg-border-light" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-2">
                <SkeletonBlock className="h-4 w-20" />
                <SkeletonBlock className="h-10 w-full" />
              </div>
            ))}
          </div>
          <SkeletonBlock className="h-10 w-32" />
        </div>
      </Card>
    </PageContainer>
  );
}

export default function ProfilePage() {
  const { stage } = useAccount();
  const allowed = useRoleGuard(['user', 'dealer', 'admin', 'repairer', 'manager']);

  if (!allowed) {
    if (stage === 'skeleton') return <ProfileSkeleton />;
    return null;
  }

  return (
    <PageContainer>
      <PageHeader>Профиль</PageHeader>
      <Card>
        <ProfileForm />
      </Card>
    </PageContainer>
  );
}
