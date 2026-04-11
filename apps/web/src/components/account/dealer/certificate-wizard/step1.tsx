'use client';

import { useState, useEffect } from 'react';
import { Button, Input, FormField } from '@asko/ui';
import { dealerApi, type SearchedUser } from '@/lib/api/dealer';
import type { FormData } from './types';

export function Step1({
  data,
  onChange,
}: {
  data: FormData;
  onChange: (d: Partial<FormData>) => void;
}) {
  const [emailQuery, setEmailQuery] = useState('');
  const [results, setResults] = useState<SearchedUser | null>();
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SearchedUser | null>(null);

  useEffect(() => {
    if (data.clientUserId && results) {
      setSelectedUser(results);
    }
  }, []);

  const handleSearch = async () => {
    if (emailQuery.length < 3) return;
    setSearching(true);
    try {
      const { data: user } = await dealerApi.searchUser(emailQuery);
      setResults(user);
    } catch {
      setResults(null);
    } finally {
      setSearching(false);
    }
  };

  const handleSelect = (user: SearchedUser) => {
    setSelectedUser(user);
    onChange({ clientUserId: user.id });
  };

  return (
    <div className="flex flex-col gap-6">
      <FormField label="Найти клиента по email" variant="bold">
        <div className="flex gap-2 max-w-[500px]">
          <Input
            placeholder="email@example.com"
            value={emailQuery}
            onChange={(e) => setEmailQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearch())}
          />
          <Button variant="secondary" size="sm" onClick={handleSearch} disabled={searching || emailQuery.length < 3}>
            {searching ? '...' : 'Найти'}
          </Button>
        </div>
      </FormField>

      {results && (() => {
        const name = [results.lastName, results.firstName].filter(Boolean).join(' ') || results.email || results.id;
        const isSelected = selectedUser?.id === results.id;
        return (
          <div className="flex flex-col gap-1 max-w-[500px]">
            <button
              type="button"
              onClick={() => handleSelect(results)}
              className={`text-left px-4 py-2.5 text-sm border transition-colors ${isSelected
                ? 'border-brand-red bg-brand-red/5 text-text-main'
                : 'border-border-light hover:border-text-sub text-text-main'
                }`}
            >
              <span className="font-medium">{name}</span>
              {results.email && <span className="text-text-sub ml-2">{results.email}</span>}
            </button>
          </div>
        );
      })()}

      {results === null && !searching && (
        <p className="text-sm text-text-sub">Пользователь не найден</p>
      )}

      {selectedUser && (
        <p className="text-sm text-success">
          Выбран: {[selectedUser.lastName, selectedUser.firstName].filter(Boolean).join(' ') || selectedUser.email}
        </p>
      )}
    </div>
  );
}
