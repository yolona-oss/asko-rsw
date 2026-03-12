'use client';

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { AccountUser, LoadingStage, UserRole } from '@/lib/account';
import { useAuth, useSession } from '@/lib/api/use-auth';
import type { Role } from '@asko/shared';

interface AccountContextType {
  stage: LoadingStage;
  user: AccountUser | null;
}

const AccountContext = createContext<AccountContextType>({
  stage: 'skeleton',
  user: null,
});

export function useAccount() {
  return useContext(AccountContext);
}

const ROLE_MAP: Partial<Record<Role, UserRole>> = {
  user: 'user',
  dealer: 'dealer',
  manager: 'manager',
};

function mapRole(roles: string[]): UserRole {
  for (const role of roles) {
    const mapped = ROLE_MAP[role as Role];
    if (mapped) return mapped;
  }
  return 'user';
}

export function AccountProvider({ children }: { children: ReactNode }) {
  const { user: authUser, isAuthenticated } = useAuth();
  const { data: sessionUser, isLoading } = useSession();
  const [stage, setStage] = useState<LoadingStage>('skeleton');
  const [user, setUser] = useState<AccountUser | null>(null);

  useEffect(() => {
    // Stage 1: we have basic auth data from Redux (login response)
    if (authUser) {
      setUser({
        name: authUser.email?.split('@')[0] ?? '',
        role: mapRole(authUser.roles),
        email: authUser.email,
      });
      setStage('partial');
    }
  }, [authUser]);

  useEffect(() => {
    // Stage 2: full session data loaded via React Query
    if (sessionUser) {
      setUser({
        name: sessionUser.email?.split('@')[0] ?? '',
        role: mapRole(sessionUser.roles),
        email: sessionUser.email,
      });
      setStage('loaded');
    }
  }, [sessionUser]);

  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      setStage('skeleton');
      setUser(null);
    }
  }, [isAuthenticated, isLoading]);

  return (
    <AccountContext.Provider value={{ stage, user }}>
      {children}
    </AccountContext.Provider>
  );
}
