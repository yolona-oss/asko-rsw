'use client';

import { useParams } from 'next/navigation';
import { useAccount } from '@/components/account/layout/provider';
import { primaryRole } from '@/lib/account';
import { UserRequestStatus } from '@/components/account/user/request-status';
import { ManagerRequestDetail } from '@/components/account/manager/request-detail';
import { RepairerRequestDetail } from '@/components/account/repairer/request-detail';

export default function RequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAccount();

  if (!user) return null;

  if (primaryRole(user) === 'manager') {
    return <ManagerRequestDetail requestId={id} />;
  }

  if (primaryRole(user) === 'repairer') {
    return <RepairerRequestDetail requestId={id} />;
  }

  return <UserRequestStatus requestId={id} />;
}
