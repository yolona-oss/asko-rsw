'use client';

import { useAccount } from '@/components/account/account-provider';
import { SkeletonBlock, SkeletonCard } from '@/components/account/skeleton';

export default function PaymentsPage() {
  const { stage } = useAccount();

  if (stage === 'skeleton') {
    return (
      <div className="p-4 lg:p-8 flex flex-col gap-6">
        <SkeletonBlock className="h-8 w-48" />
        <SkeletonCard className="h-[300px]" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 flex flex-col gap-6">
      <h1 className="text-[28px] lg:text-[36px] font-medium tracking-[-0.01em] text-text-main">
        Платежи
      </h1>
      <div className="bg-white rounded-sm border border-border-light p-6 text-text-sub">
        Раздел находится в разработке
      </div>
    </div>
  );
}
