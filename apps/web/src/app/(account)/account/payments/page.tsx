'use client';

import { useAccount } from '@/components/account/layout/provider';
import { primaryRole } from '@/lib/account';
import { ManagerPayments } from '@/components/account/manager/payments';
import { UserPayments } from '@/components/account/user/payments';
import { DealerPayments } from '@/components/account/dealer/payments';

export default function PaymentsPage() {
  const { user } = useAccount();

  if (!user) return null;

  const role = primaryRole(user);

  switch (role) {
    case 'admin':
    case 'manager':
      return <ManagerPayments />;
    case 'dealer':
      return <DealerPayments />;
    default:
      return <UserPayments />;
  }
}
