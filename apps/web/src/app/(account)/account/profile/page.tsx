'use client';

import { useAccount } from '@/components/account/account-provider';
import { ProfileForm } from '@/components/account/profile-form';
import { SkeletonBlock, SkeletonCircle } from '@/components/account/skeleton';

function ProfileSkeleton() {
  return (
    <div className="p-4 lg:p-8 flex flex-col gap-6 lg:gap-8">
      <SkeletonBlock className="h-8 w-48" />
      <div className="bg-white rounded-sm border border-border-light p-6 flex flex-col gap-8">
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
    </div>
  );
}

export default function ProfilePage() {
  const { stage, user } = useAccount();

  if (stage === 'skeleton' || !user) {
    return <ProfileSkeleton />;
  }

  return (
    <div className="p-4 lg:p-8 flex flex-col gap-6 lg:gap-8">
      <h1 className="text-[28px] lg:text-[36px] font-medium tracking-[-0.01em] text-text-main">
        Профиль
      </h1>

      <div className="bg-white rounded-sm border border-border-light p-6">
        <ProfileForm />
      </div>
    </div>
  );
}
