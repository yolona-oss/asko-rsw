'use client';

import { useState } from 'react';
import type { TokenInfo } from './use-token';
import { Role, ADMIN_ROLES, STAFF_ROLES } from '@asko/shared/client';
import { getRefreshTokenFromCookie } from './cookie-utils';

interface TokenRowProps {
  token: TokenInfo;
  onSwitch: (token: string) => void;
}

const roleColors: Record<Role, string> = {
  [Role.SUPER_ADMIN]: 'bg-purple-100 text-purple-700',
  [Role.ADMIN]: 'bg-red-100 text-red-700',
  [Role.DEALER]: 'bg-blue-100 text-blue-700',
  [Role.MANAGER]: 'bg-yellow-100 text-yellow-700',
  [Role.REPAIRER]: 'bg-orange-100 text-orange-700',
  [Role.USER]: 'bg-green-100 text-green-700',
};

const roleLabels: Record<Role, string> = {
  [Role.SUPER_ADMIN]: 'Super Admin',
  [Role.ADMIN]: 'Admin',
  [Role.DEALER]: 'Dealer',
  [Role.MANAGER]: 'Manager',
  [Role.REPAIRER]: 'Repairer',
  [Role.USER]: 'User',
};

export function TokenRow({ token, onSwitch }: TokenRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const currentToken = getRefreshTokenFromCookie();
  const isCurrentToken = currentToken === token.refreshTkn;

  const displayToken = isExpanded
    ? token.refreshTkn
    : token.refreshTkn.length > 10
      ? `${token.refreshTkn.substring(0, 10)}...`
      : token.refreshTkn;

  const isAdmin = ADMIN_ROLES.includes(token.role as any);
  const isStaff = STAFF_ROLES.includes(token.role as any);

  return (
    <div className={`p-3 transition-colors ${isCurrentToken ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${roleColors[token.role] || 'bg-gray-100 text-gray-700'}`}>
              {roleLabels[token.role] || token.role}
            </span>
            {isAdmin && (
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-purple-100 text-purple-700">
                Admin
              </span>
            )}
            {isStaff && !isAdmin && (
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                Staff
              </span>
            )}
            {isCurrentToken && (
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700">
                Current
              </span>
            )}
          </div>

          <div
            onClick={() => setIsExpanded(!isExpanded)}
            className="cursor-pointer group"
          >
            <p className="text-xs font-mono text-gray-600 break-all">
              {displayToken}
            </p>
            <p className="text-xs text-gray-400 mt-0.5 group-hover:text-gray-600">
              {isExpanded ? 'Click to collapse' : 'Click to expand'}
            </p>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {new Date(token.timestamp).toLocaleString()}
          </p>
        </div>

        {!isCurrentToken && (
          <button
            onClick={() => onSwitch(token.refreshTkn)}
            className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors whitespace-nowrap"
          >
            Switch to
          </button>
        )}
      </div>
    </div>
  );
}
