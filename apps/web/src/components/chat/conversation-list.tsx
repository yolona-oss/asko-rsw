'use client';

import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { chatApi } from '@/lib/api/chat';
import { ConversationItem } from './conversation-item';
import { Input, Button } from '@asko/ui';
import { useUserAvatars } from '@/hooks/use-user-avatars';
import type { ConversationRecord } from '@/lib/api/types';

interface ConversationListProps {
  activeId: string | null;
  currentUserId: string;
  presenceMap: Record<string, boolean>;
  participantNames: Record<string, string>;
  onRegisterParticipants: (ids: string[]) => void;
  onSelect: (conversation: ConversationRecord) => void;
  onNewChat: () => void;
}

export function ConversationList({
  activeId,
  currentUserId,
  presenceMap,
  participantNames,
  onRegisterParticipants,
  onSelect,
  onNewChat,
}: ConversationListProps) {
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['chat-conversations'],
    queryFn: async () => {
      const { data } = await chatApi.listConversations({ limit: 50 });
      return data;
    },
    refetchInterval: 30_000,
  });

  const conversations = (data?.data ?? [])
    .filter((c) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        c.name?.toLowerCase().includes(q) ||
        c.participants.some(p => {
          const name = participantNames[p.userId];
          return name?.toLowerCase().includes(q) || p.userId.toLowerCase().includes(q);
        })
      );
    })
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  // Collect other participant IDs for avatar fetching and name resolution
  const otherUserIds = useMemo(() => {
    const ids = new Set<string>();
    (data?.data ?? []).forEach(c => {
      c.participants.forEach(p => {
        if (p.userId !== currentUserId) ids.add(p.userId);
      });
    });
    return Array.from(ids);
  }, [data?.data, currentUserId]);

  // Register participant IDs for name fetching
  useEffect(() => {
    if (otherUserIds.length > 0) {
      onRegisterParticipants(otherUserIds);
    }
  }, [otherUserIds.join(',')]);

  const avatarMap = useUserAvatars(otherUserIds);

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-border-light flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-text-main">Чаты</h2>
          <Button size="sm" onClick={onNewChat}>Новый чат</Button>
        </div>
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск..."
          className="!text-sm"
        />
      </div>
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="px-4 py-8 text-center text-sm text-text-sub">Загрузка...</div>
        ) : conversations.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-text-sub">
            {search ? 'Ничего не найдено' : 'Нет чатов'}
          </div>
        ) : (
          conversations.map((c) => (
            <ConversationItem
              key={c.id}
              conversation={c}
              active={c.id === activeId}
              currentUserId={currentUserId}
              presenceMap={presenceMap}
              participantNames={participantNames}
              avatarMap={avatarMap}
              onClick={() => onSelect(c)}
            />
          ))
        )}
      </div>
    </div>
  );
}
