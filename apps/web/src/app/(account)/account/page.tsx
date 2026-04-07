'use client';

import { useAccount } from '@/components/account/account-provider';
import { primaryRole } from '@/lib/account';
import { UserDashboard } from '@/components/account/user/user-dashboard';
import { DealerDashboard } from '@/components/account/dealer/dealer-dashboard';
import { ManagerDashboard } from '@/components/account/manager/manager-dashboard';
import { AdminDashboard } from '@/components/account/admin/admin-dashboard';
import { RepairerDashboard } from '@/components/account/repairer/repairer-dashboard';

export default function AccountDashboardPage() {
  const { user } = useAccount();

  if (!user) return null;

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
}
