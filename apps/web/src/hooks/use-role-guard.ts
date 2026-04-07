'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount } from '@/components/account/layout/provider';
import { primaryRole, type UserRole } from '@/lib/account';

export function useRoleGuard(allowedRoles: UserRole[]): boolean {
  const { user } = useAccount();
  const router = useRouter();

  const role = user ? primaryRole(user) : null;
  const allowed = user !== null && role !== null && allowedRoles.includes(role);

  useEffect(() => {
    if (user && !allowed) {
      router.replace('/account');
    }
  }, [user, allowed, router]);

  return allowed;
}
