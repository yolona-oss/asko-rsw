'use client';

import { Card, SkeletonBlock, SkeletonCircle } from '@asko/ui';

export function ProfileFormSkeleton() {
  return (
    <>
      {/* Personal info card */}
      <Card>
        <div className="flex flex-col gap-8">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            <SkeletonCircle className="w-24 h-24 flex-shrink-0" />
            <div className="flex flex-col gap-2 w-full">
              <SkeletonBlock className="h-5 w-40" />
              <SkeletonBlock className="h-20 w-full" />
            </div>
          </div>
          <div className="h-px bg-border-light" />
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <SkeletonBlock className="h-4 w-16" />
              <SkeletonBlock className="h-10 w-full" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[1, 2].map(i => (
                <div key={i} className="flex flex-col gap-2">
                  <SkeletonBlock className="h-4 w-20" />
                  <SkeletonBlock className="h-10 w-full" />
                </div>
              ))}
            </div>
          </div>
          <SkeletonBlock className="h-10 w-32" />
        </div>
      </Card>

      {/* Addresses */}
      <Card>
        <div className="flex flex-col gap-4">
          <SkeletonBlock className="h-5 w-20" />
          <SkeletonBlock className="h-14 w-full" />
        </div>
      </Card>

      {/* Login methods */}
      <Card>
        <div className="flex flex-col gap-4">
          <SkeletonBlock className="h-5 w-32" />
          <SkeletonBlock className="h-10 w-full" />
          <SkeletonBlock className="h-10 w-full" />
        </div>
      </Card>

      {/* Notifications */}
      <Card>
        <div className="flex flex-col gap-4">
          <SkeletonBlock className="h-5 w-40" />
          <SkeletonBlock className="h-8 w-full" />
          <SkeletonBlock className="h-8 w-full" />
        </div>
      </Card>

      {/* Privacy */}
      <Card>
        <div className="flex flex-col gap-4">
          <SkeletonBlock className="h-5 w-36" />
          <SkeletonBlock className="h-8 w-full" />
          <SkeletonBlock className="h-8 w-full" />
        </div>
      </Card>

      {/* Language */}
      <Card>
        <div className="flex flex-col gap-4">
          <SkeletonBlock className="h-5 w-32" />
          <SkeletonBlock className="h-8 w-full" />
        </div>
      </Card>

      {/* Security */}
      <Card>
        <div className="flex flex-col gap-4">
          <SkeletonBlock className="h-5 w-56" />
          <SkeletonBlock className="h-8 w-full" />
          <div className="h-px bg-border-light" />
          <SkeletonBlock className="h-5 w-28" />
          <SkeletonBlock className="h-10 w-full" />
        </div>
      </Card>

      {/* Sessions */}
      <Card>
        <div className="flex flex-col gap-4">
          <SkeletonBlock className="h-5 w-32" />
          <SkeletonBlock className="h-14 w-full" />
          <SkeletonBlock className="h-14 w-full" />
        </div>
      </Card>
    </>
  );
}
