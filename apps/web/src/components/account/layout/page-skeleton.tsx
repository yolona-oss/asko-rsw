import { SkeletonBlock, SkeletonCircle } from '@asko/ui';

/** Generic account page skeleton matching the real layout:
 *  PageHeader → DataToolbar (search + filter bar) → ViewSwitcher → DataGrid rows
 */
export function AccountPageSkeleton() {
  return (
    <div className="p-4 lg:p-8 flex flex-col gap-6 lg:gap-8">
      {/* Page header */}
      <SkeletonBlock className="h-9 w-48" />

      {/* Toolbar: search box + filter bar */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="lg:w-[320px] flex-shrink-0 bg-surface border border-border h-[42px]">
          <SkeletonBlock className="h-full w-full opacity-30" />
        </div>
        <div className="flex-1 bg-surface border border-border h-[42px] flex items-center px-5 gap-6">
          <SkeletonBlock className="h-4 w-20" />
          <div className="w-px h-[35px] bg-border-divider" />
          <SkeletonBlock className="h-4 w-24" />
          <div className="w-px h-[35px] bg-border-divider" />
          <SkeletonBlock className="h-4 w-16" />
        </div>
      </div>

      {/* View switcher */}
      <div className="flex gap-0">
        <SkeletonBlock className="h-9 w-24 border border-border" />
        <SkeletonBlock className="h-9 w-24 border border-border -ml-px" />
      </div>

      {/* DataGrid skeleton */}
      <div className="bg-surface border-y lg:border border-border -mx-4 lg:mx-0">
        {/* Header row */}
        <div className="hidden lg:flex items-center bg-surface-secondary border-b border-border-divider px-6 py-3 gap-6">
          <SkeletonBlock className="h-4 w-28" />
          <SkeletonBlock className="h-4 w-20" />
          <SkeletonBlock className="h-4 w-24" />
          <SkeletonBlock className="h-4 w-16" />
          <SkeletonBlock className="h-4 w-20" />
        </div>
        {/* Data rows */}
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center px-4 lg:px-6 py-3 border-b border-border-divider last:border-b-0 gap-4 lg:gap-6">
            <SkeletonCircle className="w-8 h-8 hidden lg:block" />
            <SkeletonBlock className="h-4 flex-1" />
            <SkeletonBlock className="h-4 w-20 hidden sm:block" />
            <SkeletonBlock className="h-4 w-16 hidden lg:block" />
            <SkeletonBlock className="h-4 w-24 hidden lg:block" />
          </div>
        ))}
        {/* Footer */}
        <div className="flex items-center justify-between px-4 lg:px-6 py-2.5 border-t border-border-divider">
          <SkeletonBlock className="h-3 w-32" />
          <div className="flex gap-1">
            <SkeletonBlock className="h-7 w-7" />
            <SkeletonBlock className="h-7 w-7" />
            <SkeletonBlock className="h-7 w-7" />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Dashboard skeleton: greeting + stat cards + chart cards */
export function DashboardPageSkeleton() {
  return (
    <div className="p-4 lg:p-8 flex flex-col gap-6 lg:gap-8">
      {/* Greeting */}
      <div className="flex flex-col gap-2">
        <SkeletonBlock className="h-10 w-64" />
        <SkeletonBlock className="h-10 w-48" />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-surface border border-border p-6 flex flex-col gap-3">
            <SkeletonBlock className="h-4 w-24" />
            <SkeletonBlock className="h-10 w-32" />
            <SkeletonBlock className="h-3 w-20" />
          </div>
        ))}
      </div>

      {/* Chart cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="bg-surface border border-border p-6 flex flex-col gap-4">
            <SkeletonBlock className="h-6 w-40" />
            <SkeletonBlock className="h-[120px] w-full" />
            <SkeletonBlock className="h-4 w-48" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Form page skeleton: title + form card with fields */
export function FormPageSkeleton() {
  return (
    <div className="p-4 lg:p-8 flex flex-col gap-6 lg:gap-8">
      <SkeletonBlock className="h-9 w-48" />
      <div className="bg-surface border border-border p-6 flex flex-col gap-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
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
