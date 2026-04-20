'use client';

import { useState, useCallback } from 'react';
import { Modal, Input, Button, Avatar } from '@asko/ui';
import { chatApi } from '@/lib/api/chat';
import type { ConversationRecord } from '@/lib/api/types';
import type { ChatUserSearchResult } from '@/lib/api/chat';

interface NewConversationDialogProps {
  onClose: () => void;
  onCreated: (conversation: ConversationRecord) => void;
}

export function NewConversationDialog({ onClose, onCreated }: NewConversationDialogProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ChatUserSearchResult[]>([]);
  const [selected, setSelected] = useState<ChatUserSearchResult | null>(null);
  const [searching, setSearching] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    try {
      const { data } = await chatApi.searchUsers(q, 20);
      setResults(data.users ?? []);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    setError(null);
    search(value);
  };

  const handleCreate = async () => {
    if (!selected) return;
    setCreating(true);
    setError(null);
    try {
      const { data } = await chatApi.createConversation({
        type: 'direct',
        participantIds: [selected.id],
      });
      onCreated(data.conversation);
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Не удалось создать чат';
      setError(msg);
    } finally {
      setCreating(false);
    }
  };

  const displayName = (u: ChatUserSearchResult) =>
    [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email || u.id.slice(0, 8);

  return (
    <Modal open onClose={onClose}>
      <div className="p-6 w-full max-w-md">
        <h2 className="text-lg font-medium text-text-main mb-4">Новый чат</h2>

        <Input
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          placeholder="Поиск по email или имени..."
          className="mb-3"
        />

        {searching && <p className="text-xs text-text-sub mb-2">Поиск...</p>}

        {/* Results */}
        <div className="max-h-60 overflow-y-auto mb-4">
          {results.length === 0 && query.length >= 2 && !searching && (
            <p className="text-xs text-text-sub text-center py-4">Пользователи не найдены</p>
          )}
          {results.map((user) => (
            <button
              key={user.id}
              type="button"
              onClick={() => setSelected(user)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-sm transition-colors cursor-pointer ${
                selected?.id === user.id ? 'bg-surface-secondary' : 'hover:bg-surface-hover'
              }`}
            >
              <Avatar size="sm" fallback={displayName(user).slice(0, 2)} />
              <div className="text-left min-w-0">
                <p className="text-sm text-text-main truncate">{displayName(user)}</p>
                {user.email && (
                  <p className="text-xs text-text-sub truncate">{user.email}</p>
                )}
              </div>
            </button>
          ))}
        </div>

        {error && <p className="text-xs text-brand-red mb-3">{error}</p>}

        <div className="flex items-center justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>Отмена</Button>
          <Button onClick={handleCreate} disabled={!selected || creating}>
            {creating ? 'Создание...' : 'Создать'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
