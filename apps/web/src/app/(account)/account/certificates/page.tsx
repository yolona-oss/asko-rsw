'use client';

import { useAccount } from '@/components/account/account-provider';
import { useRoleGuard } from '@/hooks/use-role-guard';
import { primaryRole } from '@/lib/account';
import { UserCertificates } from '@/components/account/user/certificates';
import { DealerCertificates } from '@/components/account/dealer/dealer-certificates';

export default function CertificatesPage() {
  const { user } = useAccount();
  const allowed = useRoleGuard(['user', 'dealer']);

  if (!allowed) return null;

  if (user && primaryRole(user) === 'dealer') {
    return <DealerCertificates />;
  }

  return <UserCertificates />;
}
