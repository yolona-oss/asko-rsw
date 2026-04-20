import { SkeletonBlock, SkeletonCircle } from '@asko/ui';
import { PageContainer } from './page-container';

/** Generic account page skeleton matching the real layout:
 *  PageHeader → DataToolbar (search + filter bar) → ViewSwitcher → DataGrid rows
 */
export function AccountPageSkeleton() {
  return (
    <PageContainer>
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
    </PageContainer>
  );
}

/** Admin/Manager dashboard: greeting + date range + 4-col compact stat cards + 2-col chart cards + quick actions */
export function AdminDashboardSkeleton() {
  return (
    <PageContainer>
      {/* Greeting (large) */}
      <div className="flex flex-col gap-2">
        <SkeletonBlock className="h-10 w-64" />
        <SkeletonBlock className="h-10 w-48" />
      </div>

      {/* Date range */}
      <SkeletonBlock className="h-5 w-36" />

      {/* 4-col stat cards (compact: p-5, value h-[44px]) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-surface border border-border shadow-sm p-5 flex flex-col gap-1.5">
            <SkeletonBlock className="h-5 w-24" />
            <SkeletonBlock className="h-[44px] w-28" />
            <SkeletonBlock className="h-4 w-20" />
          </div>
        ))}
      </div>

      {/* 2-col chart cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="bg-surface border border-border shadow-sm p-6 flex flex-col gap-4">
            <SkeletonBlock className="h-5 w-40" />
            <div className="flex items-center gap-6">
              <SkeletonCircle className="w-[100px] h-[100px]" />
              <div className="flex-1 flex flex-col gap-2">
                <SkeletonBlock className="h-4 w-24" />
                <SkeletonBlock className="h-4 w-20" />
                <SkeletonBlock className="h-4 w-28" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-[42px] w-full" />
        ))}
      </div>
    </PageContainer>
  );
}

/** User dashboard: greeting + 3-col hero stat cards + last request card + CTA banner */
export function UserDashboardSkeleton() {
  return (
    <PageContainer>
      {/* Greeting (large) */}
      <div className="flex flex-col gap-2">
        <SkeletonBlock className="h-10 w-64" />
        <SkeletonBlock className="h-10 w-48" />
      </div>

      {/* 3-col stat cards (hero: p-6, value h-[86px]) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-surface border border-border-light p-6 flex flex-col gap-2">
            <SkeletonBlock className="h-7 w-32" />
            <SkeletonBlock className="h-[86px] w-24" />
          </div>
        ))}
      </div>

      {/* Last request card (desktop only) */}
      <div className="hidden lg:flex bg-surface border border-border-light p-6 flex-col gap-3">
        <SkeletonBlock className="h-7 w-48" />
        <SkeletonBlock className="h-4 w-40" />
        <SkeletonBlock className="h-4 w-32" />
      </div>

      {/* CTA banner */}
      <SkeletonBlock className="h-[200px] w-full" />
    </PageContainer>
  );
}

/** Dealer dashboard: greeting + date range + 3-col stat cards + donut chart + quick actions */
export function DealerDashboardSkeleton() {
  return (
    <PageContainer>
      {/* Greeting (large) */}
      <div className="flex flex-col gap-2">
        <SkeletonBlock className="h-10 w-64" />
        <SkeletonBlock className="h-10 w-48" />
      </div>

      {/* Date range */}
      <SkeletonBlock className="h-5 w-36" />

      {/* 3-col stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-surface border border-border shadow-sm p-6 flex flex-col gap-2">
            <SkeletonBlock className="h-7 w-32" />
            <SkeletonBlock className="h-[86px] w-20" />
            <SkeletonBlock className="h-4 w-28" />
          </div>
        ))}
      </div>

      {/* Donut chart card */}
      <div className="bg-surface border border-border shadow-sm p-6 flex flex-col gap-4">
        <SkeletonBlock className="h-5 w-48" />
        <div className="flex items-center gap-6">
          <SkeletonCircle className="w-[100px] h-[100px]" />
          <div className="flex-1 flex flex-col gap-2">
            <SkeletonBlock className="h-4 w-28" />
            <SkeletonBlock className="h-4 w-24" />
            <SkeletonBlock className="h-4 w-20" />
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SkeletonBlock className="h-[42px] w-full" />
        <SkeletonBlock className="h-[42px] w-full" />
      </div>
    </PageContainer>
  );
}

/** Repairer dashboard: greeting + location card + active request card + completed count */
export function RepairerDashboardSkeleton() {
  return (
    <PageContainer>
      {/* Greeting (large) */}
      <div className="flex flex-col gap-2">
        <SkeletonBlock className="h-10 w-64" />
        <SkeletonBlock className="h-10 w-48" />
      </div>

      {/* Location card */}
      <div className="bg-surface border border-border-light p-6 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <SkeletonBlock className="h-7 w-44" />
          <SkeletonBlock className="h-4 w-20" />
        </div>
        <SkeletonBlock className="h-4 w-48" />
        <SkeletonBlock className="h-4 w-56" />
      </div>

      {/* Active request card */}
      <div className="bg-surface border border-border-light p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <SkeletonBlock className="h-7 w-40" />
          <SkeletonBlock className="h-6 w-24" />
        </div>
        <SkeletonBlock className="h-4 w-52" />
        <SkeletonBlock className="h-4 w-full max-w-xs" />
        <SkeletonBlock className="h-10 w-40" />
      </div>

      {/* Completed count card */}
      <div className="bg-surface border border-border-light p-6 flex items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <SkeletonBlock className="h-5 w-44" />
          <SkeletonBlock className="h-[44px] w-16" />
        </div>
        <SkeletonBlock className="h-10 w-24" />
      </div>
    </PageContainer>
  );
}

/** Form page skeleton: title + form card with fields */
export function FormPageSkeleton() {
  return (
    <PageContainer>
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
    </PageContainer>
  );
}

/** Profile page skeleton: header + multi-card sections */
export function ProfilePageSkeleton() {
  return (
    <PageContainer>
      {/* Page header */}
      <SkeletonBlock className="h-9 w-32" />

      {/* Personal info card */}
      <div className="bg-surface border border-border-light p-6 flex flex-col gap-6 lg:gap-8">
        <div className="flex flex-col sm:flex-row items-start gap-6">
          <SkeletonCircle className="w-24 h-24 flex-shrink-0" />
          <div className="flex flex-col gap-3 w-full">
            <SkeletonBlock className="h-4 w-28" />
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
            <div className="flex flex-col gap-2">
              <SkeletonBlock className="h-4 w-14" />
              <SkeletonBlock className="h-10 w-full" />
            </div>
            <div className="flex flex-col gap-2">
              <SkeletonBlock className="h-4 w-20" />
              <SkeletonBlock className="h-10 w-full" />
            </div>
          </div>
        </div>
        <SkeletonBlock className="h-10 w-32" />
      </div>

      {/* Section cards */}
      {['w-20', 'w-32', 'w-40', 'w-36', 'w-32'].map((w, i) => (
        <div key={i} className="bg-surface border border-border-light p-6 flex flex-col gap-4">
          <SkeletonBlock className={`h-5 ${w}`} />
          <SkeletonBlock className="h-10 w-full" />
        </div>
      ))}

      {/* Security card */}
      <div className="bg-surface border border-border-light p-6 flex flex-col gap-4">
        <SkeletonBlock className="h-5 w-56" />
        <SkeletonBlock className="h-8 w-full" />
        <div className="h-px bg-border-light" />
        <SkeletonBlock className="h-5 w-28" />
        <SkeletonBlock className="h-10 w-full" />
      </div>

      {/* Sessions card */}
      <div className="bg-surface border border-border-light p-6 flex flex-col gap-4">
        <SkeletonBlock className="h-5 w-32" />
        <SkeletonBlock className="h-14 w-full" />
        <SkeletonBlock className="h-14 w-full" />
      </div>
    </PageContainer>
  );
}

/** Schedule list page skeleton: header + toolbar + grouped user schedule cards */
export function SchedulePageSkeleton() {
  return (
    <PageContainer>
      {/* Page header */}
      <SkeletonBlock className="h-9 w-40" />

      {/* DataToolbar: filter bar + action button */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 bg-surface border border-border h-[42px] flex items-center px-5 gap-6">
          <SkeletonBlock className="h-4 w-16" />
          <div className="w-px h-[35px] bg-border-divider" />
          <SkeletonBlock className="h-4 w-20" />
        </div>
        <SkeletonBlock className="h-[42px] w-44" />
      </div>

      {/* Grouped user schedule cards (3 groups) */}
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex flex-col gap-3">
          <SkeletonBlock className="h-5 w-44" />
          {Array.from({ length: 2 }).map((_, j) => (
            <div key={j} className="bg-surface border border-border-light p-3 sm:p-4 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <SkeletonBlock className="h-5 w-20" />
                <SkeletonBlock className="h-5 w-24" />
              </div>
              <SkeletonBlock className="h-4 w-48" />
            </div>
          ))}
        </div>
      ))}
    </PageContainer>
  );
}

/** My schedule page skeleton: header + 3-col stats + pattern section + exceptions */
export function MySchedulePageSkeleton() {
  return (
    <PageContainer>
      {/* Page header */}
      <SkeletonBlock className="h-9 w-48" />

      {/* 3-col stats strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-surface border border-border-light p-3 sm:p-4 flex flex-col gap-1">
            <SkeletonBlock className="h-3 w-28" />
            <SkeletonBlock className="h-6 sm:h-7 w-16" />
          </div>
        ))}
      </div>

      {/* Pattern editor section */}
      <div className="flex flex-col gap-3">
        <SkeletonBlock className="h-4 w-32" />
        <SkeletonBlock className="h-32 w-full" />
      </div>

      {/* Exception entries section */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <SkeletonBlock className="h-4 w-64" />
          <div className="flex gap-2">
            <SkeletonBlock className="h-8 w-20" />
            <SkeletonBlock className="h-8 w-28" />
          </div>
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-surface border border-border-light p-3 sm:p-4 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <SkeletonBlock className="h-5 w-20" />
              <SkeletonBlock className="h-5 w-24" />
            </div>
            <SkeletonBlock className="h-4 w-40" />
          </div>
        ))}
      </div>
    </PageContainer>
  );
}

/** User payments skeleton: header + card grid (matches UserPayments own loading state) */
export function UserPaymentsSkeleton() {
  return (
    <PageContainer>
      <SkeletonBlock className="h-9 w-32" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-36" />
        ))}
      </div>
    </PageContainer>
  );
}

/** Dealer payments skeleton: header + balance card + chart cards + data grid */
export function DealerPaymentsSkeleton() {
  return (
    <PageContainer>
      <SkeletonBlock className="h-9 w-32" />

      {/* Balance card */}
      <div className="bg-surface border border-border-light p-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <SkeletonBlock className="h-7 w-36" />
          <SkeletonBlock className="h-[86px] w-32" />
        </div>
        <SkeletonBlock className="h-12 w-44" />
      </div>

      {/* 2-col chart cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="bg-surface border border-border shadow-sm p-6 flex flex-col gap-4">
            <SkeletonBlock className="h-5 w-36" />
            <SkeletonBlock className="h-[120px] w-full" />
            <SkeletonBlock className="h-4 w-40" />
          </div>
        ))}
      </div>

      {/* Section heading */}
      <SkeletonBlock className="h-5 w-36" />

      {/* DataGrid skeleton */}
      <div className="bg-surface border-y lg:border border-border -mx-4 lg:mx-0">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center px-4 lg:px-6 py-3 border-b border-border-divider last:border-b-0 gap-4 lg:gap-6">
            <SkeletonBlock className="h-4 flex-1" />
            <SkeletonBlock className="h-4 w-20 hidden sm:block" />
            <SkeletonBlock className="h-4 w-24 hidden lg:block" />
          </div>
        ))}
      </div>
    </PageContainer>
  );
}

/** Detail page skeleton: header + status + content card + secondary section */
export function DetailPageSkeleton() {
  return (
    <PageContainer>
      <SkeletonBlock className="h-9 w-52" />

      {/* Status section */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <SkeletonBlock className="h-8 w-44" />
          <SkeletonBlock className="h-6 w-28" />
        </div>
        <SkeletonBlock className="h-4 w-36" />
      </div>

      {/* Content card */}
      <SkeletonBlock className="h-[300px] w-full" />

      {/* Secondary section */}
      <div className="flex flex-col gap-4">
        <SkeletonBlock className="h-5 w-36" />
        <SkeletonBlock className="h-[100px] w-full" />
      </div>
    </PageContainer>
  );
}

/** Graph page skeleton: header + legend + graph area */
export function GraphPageSkeleton() {
  return (
    <PageContainer>
      <SkeletonBlock className="h-9 w-64" />

      {/* Legend */}
      <div className="flex gap-6">
        <SkeletonBlock className="h-3 w-16" />
        <SkeletonBlock className="h-3 w-20" />
        <SkeletonBlock className="h-3 w-16" />
      </div>

      {/* Graph area */}
      <SkeletonBlock className="h-[500px] w-full" />
    </PageContainer>
  );
}
