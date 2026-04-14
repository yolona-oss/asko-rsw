'use client';

import { lazy, Suspense } from 'react';
import { useAccount } from '@/components/account/layout/provider';
import { primaryRole } from '@/lib/account';
import { DashboardPageSkeleton } from '@/components/account/layout/page-skeleton';

const UserDashboard = lazy(() => import('@/components/account/dashboard').then(m => ({ default: m.UserDashboard })));
const DealerDashboard = lazy(() => import('@/components/account/dashboard/dealer-dashboard').then(m => ({ default: m.DealerDashboard })));
const ManagerDashboard = lazy(() => import('@/components/account/dashboard/manager-dashboard').then(m => ({ default: m.ManagerDashboard })));
const AdminDashboard = lazy(() => import('@/components/account/dashboard/admin-dashboard').then(m => ({ default: m.AdminDashboard })));
const RepairerDashboard = lazy(() => import('@/components/account/dashboard/repairer-dashboard').then(m => ({ default: m.RepairerDashboard })));

export default function AccountDashboardPage() {
  const { user } = useAccount();

  if (!user) return null;

  const content = (() => {
    switch (primaryRole(user)) {
      case 'admin':
        return <AdminDashboard />;
      case 'dealer':
        return <DealerDashboard />;
      case 'manager':
        return <ManagerDashboard />;
      case 'repairer':
        return <RepairerDashboard />;
      default:
        return <UserDashboard />;
    }
  })();

  return <Suspense fallback={<DashboardPageSkeleton />}>{content}</Suspense>;
}
