'use client';

import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from 'react';
import type { AccountUser, LoadingStage } from '@/lib/account';
import { useAuth, useSession } from '@/lib/api/use-auth';
import { profileApi } from '@/lib/api/profile';

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

export function AccountProvider({ children }: { children: ReactNode }) {
  const { user: authUser, isAuthenticated } = useAuth();
  const { data: sessionUser, isLoading } = useSession();
  const [stage, setStage] = useState<LoadingStage>('skeleton');
  const [user, setUser] = useState<AccountUser | null>(null);

  useEffect(() => {
    // Stage 1: we have basic auth data from Redux (login response)
    if (authUser) {
      setUser((prev) => ({ ...authUser, avatar: prev?.avatar }));
      // Only upgrade skeleton → partial, never downgrade loaded → partial
      setStage((prev) => prev === 'skeleton' ? 'partial' : prev);
    }
  }, [authUser]);

  const avatarFetched = useRef(false);

  useEffect(() => {
    // Stage 2: full session data loaded via React Query
    if (sessionUser) {
      setUser((prev) => ({ ...sessionUser, avatar: prev?.avatar }));
      setStage('loaded');

      // Fetch avatar once
      if (!avatarFetched.current) {
        avatarFetched.current = true;
        profileApi.getAvatarUrl(sessionUser.id).then((url) => {
          if (url) {
            setUser((prev) => prev ? { ...prev, avatar: url } : prev);
          }
        });
      }
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
