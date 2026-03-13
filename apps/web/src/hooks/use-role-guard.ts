'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount } from '@/components/account/account-provider';
import { primaryRole, type UserRole } from '@/lib/account';

export function useRoleGuard(allowedRoles: UserRole[]): boolean {
  const { stage, user } = useAccount();
  const router = useRouter();

  const isLoaded = stage !== 'skeleton' && user !== null;
  const role = user ? primaryRole(user) : null;
  const allowed = isLoaded && role !== null && allowedRoles.includes(role);

  useEffect(() => {
    if (isLoaded && !allowed) {
      router.replace('/account');
    }
  }, [isLoaded, allowed, router]);

  return allowed;
}
