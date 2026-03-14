'use client';

import { useState } from 'react';
import { Role, ALL_ROLES } from '@asko/shared/client';

interface AddTokenFormProps {
  onAdd: (token: string, role: Role) => Promise<void>;
  onCancel: () => void;
}

const roleOptions = ALL_ROLES.map(role => ({
  value: role,
  label: role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
}));

export function AddTokenForm({ onAdd, onCancel }: AddTokenFormProps) {
  const [token, setToken] = useState('');
  const [role, setRole] = useState<Role>(Role.USER);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim() || !role) return;

    setIsLoading(true);
    try {
      await onAdd(token.trim(), role);
      setToken('');
      setRole(Role.USER);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Refresh Token
        </label>
        <input
          type="text"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Enter refresh token"
          disabled={isLoading}
          required
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Role
        </label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as Role)}
          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          disabled={isLoading}
        >
          {roleOptions.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 px-2 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {isLoading ? 'Adding...' : 'Add'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="px-2 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
