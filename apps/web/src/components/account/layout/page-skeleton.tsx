import { SkeletonBlock, SkeletonCard } from '@asko/ui';

export function AccountPageSkeleton() {
  return (
    <div className="p-4 lg:p-8 flex flex-col gap-6 lg:gap-8">
      <SkeletonBlock className="h-8 w-64" />
      <SkeletonCard className="h-[500px]" />
    </div>
  );
}
