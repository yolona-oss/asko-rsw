'use client';

import { useAccount } from '@/components/account/account-provider';
import { ManagerRequests } from '@/components/account/manager/manager-requests';
import { SkeletonBlock, SkeletonCard } from '@/components/account/skeleton';

export default function RequestsPage() {
  const { stage, user } = useAccount();

  if (stage === 'skeleton' || !user) {
    return (
      <div className="p-4 lg:p-8 flex flex-col gap-6">
        <SkeletonBlock className="h-8 w-72" />
        <div className="flex gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} className="h-10 w-28" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {Array.from({ length: 9 }).map((_, i) => (
            <SkeletonCard key={i} className="h-[200px]" />
          ))}
        </div>
      </div>
    );
  }

  if (user.role === 'manager') {
    return <ManagerRequests />;
  }

  // User role - show their requests (placeholder for now, request detail is via [id])
  return (
    <div className="p-4 lg:p-8 flex flex-col gap-6">
      <h1 className="text-[28px] lg:text-[36px] font-medium tracking-[-0.01em] text-text-main">
        Мои заявки
      </h1>
      <div className="bg-white rounded-sm border border-border-light p-6 text-text-sub">
        У вас пока нет заявок
      </div>
    </div>
  );
}
