'use client';

import { SkeletonBlock, SkeletonCircle } from './skeleton';

export function ProfileFormSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col sm:flex-row items-start gap-6">
        <SkeletonCircle className="w-24 h-24 flex-shrink-0" />
        <div className="flex flex-col gap-2 w-full">
          <SkeletonBlock className="h-5 w-40" />
          <SkeletonBlock className="h-4 w-64" />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-2">
            <SkeletonBlock className="h-4 w-20" />
            <SkeletonBlock className="h-10 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
