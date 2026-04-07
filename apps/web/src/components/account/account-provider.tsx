'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { AccountUser } from '@/lib/account';
import { useAuth, useSession } from '@/lib/api/use-auth';
import { usersApi } from '@/lib/api/users';

interface AccountContextType {
  user: AccountUser | null;
}

const AccountContext = createContext<AccountContextType>({
  user: null,
});

export function useAccount() {
  return useContext(AccountContext);
}

export function AccountProvider({ children }: { children: ReactNode }) {
  const { user: authUser, isAuthenticated } = useAuth();
  const { data: sessionUser, isLoading } = useSession();

  const { data: avatarUrl } = useQuery({
    queryKey: ['user-avatar', sessionUser?.id],
    queryFn: () => usersApi.getAvatarUrl(sessionUser!.id),
    enabled: !!sessionUser?.id,
    staleTime: 5 * 60 * 1000,
  });

  const user = useMemo<AccountUser | null>(() => {
    if (!isAuthenticated && !isLoading) return null;
    const base = sessionUser ?? authUser;
    if (!base) return null;
    return { ...base, avatar: avatarUrl ?? undefined };
  }, [authUser, sessionUser, avatarUrl, isAuthenticated, isLoading]);

  return (
    <AccountContext.Provider value={{ user }}>
      {children}
    </AccountContext.Provider>
  );
}
