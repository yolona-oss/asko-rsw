'use client';

import { useState, useEffect } from 'react';
import { DevToolbarButton } from './toolbar-button';
import { DevToolbarMenu } from './menu';
import { useTokens } from './use-token';
import { useAuth } from '@/lib/api/use-auth';
import { useSession } from '@/lib/api/use-auth';
import { getRefreshTokenFromCookie } from './cookie-utils';
import { Role } from '@asko/shared/client';

export function DevToolbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { tokens, addToken, switchToToken, loadTokensFromSession } = useTokens();
  const { user: authUser, isAuthenticated } = useAuth();
  const { data: sessionUser } = useSession();

  // Auto-scrape tokens from current session
  useEffect(() => {
    if (isAuthenticated) {
      const refreshToken = getRefreshTokenFromCookie();
      if (refreshToken) {
        const role = authUser?.roles[0] as Role || sessionUser?.roles[0] as Role || Role.USER;
        loadTokensFromSession(refreshToken, role);
      }
    }
  }, [isAuthenticated, authUser, sessionUser, loadTokensFromSession]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('[data-dev-toolbar]')) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div data-dev-toolbar className="fixed bottom-4 right-4 z-50">
      <DevToolbarButton isOpen={isOpen} onClick={() => setIsOpen(!isOpen)} />
      {isOpen && (
        <DevToolbarMenu
          tokens={tokens}
          onAddToken={(t, r) => addToken(t, r as Role)}
          onSwitchToken={switchToToken}
        />
      )}
    </div>
  );
}
