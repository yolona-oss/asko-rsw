'use client';

import { lazy, Suspense } from 'react';
import { useAccount } from '@/components/account/layout/provider';
import { primaryRole } from '@/lib/account';
import {
  AdminDashboardSkeleton,
  UserDashboardSkeleton,
  DealerDashboardSkeleton,
  RepairerDashboardSkeleton,
} from '@/components/account/layout/page-skeleton';

const UserDashboard = lazy(() => import('@/components/account/dashboard').then(m => ({ default: m.UserDashboard })));
const DealerDashboard = lazy(() => import('@/components/account/dashboard/dealer').then(m => ({ default: m.DealerDashboard })));
const ManagerDashboard = lazy(() => import('@/components/account/dashboard/manager').then(m => ({ default: m.ManagerDashboard })));
const AdminDashboard = lazy(() => import('@/components/account/dashboard/admin').then(m => ({ default: m.AdminDashboard })));
const RepairerDashboard = lazy(() => import('@/components/account/dashboard/repairer').then(m => ({ default: m.RepairerDashboard })));

export default function AccountDashboardPage() {
  const { user } = useAccount();

  if (!user) return null;

  const role = primaryRole(user);

  const content = (() => {
    switch (role) {
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

  const skeleton = (() => {
    switch (role) {
      case 'admin':
      case 'manager':
        return <AdminDashboardSkeleton />;
      case 'dealer':
        return <DealerDashboardSkeleton />;
      case 'repairer':
        return <RepairerDashboardSkeleton />;
      default:
        return <UserDashboardSkeleton />;
    }
  })();

  return <Suspense fallback={skeleton}>{content}</Suspense>;
}
