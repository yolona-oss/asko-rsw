'use client';

import { useState } from 'react';
import { TokenRow } from './token-row';
import { AddTokenForm } from './add-token-form';
import type { TokenInfo } from './use-token';

interface DevToolbarMenuProps {
  tokens: TokenInfo[];
  onAddToken: (token: string, role: string) => Promise<void>;
  onSwitchToken: (token: string) => void;
}

export function DevToolbarMenu({ tokens, onAddToken, onSwitchToken }: DevToolbarMenuProps) {
  const [showAddForm, setShowAddForm] = useState(false);

  return (
    <div className="absolute bottom-16 right-0 w-80 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
      <div className="p-4 bg-gray-50 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700">Developer Tools</h3>
        <p className="text-xs text-gray-500 mt-1">Manage test tokens</p>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {tokens.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">
            No tokens stored
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {tokens.map((token, index) => (
              <TokenRow
                key={index}
                token={token}
                onSwitch={onSwitchToken}
              />
            ))}
          </div>
        )}
      </div>

      <div className="p-3 bg-gray-50 border-t border-gray-200">
        {showAddForm ? (
          <AddTokenForm
            onAdd={async (token, role) => {
              await onAddToken(token, role);
              setShowAddForm(false);
            }}
            onCancel={() => setShowAddForm(false)}
          />
        ) : (
          <button
            onClick={() => setShowAddForm(true)}
            className="w-full px-3 py-2 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            + Add Test Token
          </button>
        )}
      </div>
    </div>
  );
}
