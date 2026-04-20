'use client';

import { useState, useMemo, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '@/store/index';
import { selectAllConversations, selectPresenceMap, selectParticipantNames, fetchParticipantProfiles } from '@/store/chat';
import { ConversationItem } from './conversation-item';
import { Input, Button } from '@asko/ui';
import { useUserAvatars } from '@/hooks/use-user-avatars';
import type { ConversationRecord } from '@/lib/api/types';

interface ConversationListProps {
  activeId: string | null;
  currentUserId: string;
  onSelect: (conversation: ConversationRecord) => void;
  onNewChat: () => void;
}

export function ConversationList({
  activeId,
  currentUserId,
  onSelect,
  onNewChat,
}: ConversationListProps) {
  const dispatch = useAppDispatch();
  const [search, setSearch] = useState('');

  const allConversations = useAppSelector(selectAllConversations);
  const presenceMap = useAppSelector(selectPresenceMap);
  const participantNames = useAppSelector(selectParticipantNames);

  const conversations = allConversations.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.name?.toLowerCase().includes(q) ||
      c.participants.some(p => {
        const name = participantNames[p.userId];
        return name?.toLowerCase().includes(q) || p.userId.toLowerCase().includes(q);
      })
    );
  });

  // Collect other participant IDs for avatar fetching and name resolution
  const otherUserIds = useMemo(() => {
    const ids = new Set<string>();
    allConversations.forEach(c => {
      c.participants.forEach(p => {
        if (p.userId !== currentUserId) ids.add(p.userId);
      });
    });
    return Array.from(ids);
  }, [allConversations, currentUserId]);

  // Register participant IDs for name fetching
  useEffect(() => {
    if (otherUserIds.length > 0) {
      dispatch(fetchParticipantProfiles(otherUserIds));
    }
  }, [otherUserIds.join(','), dispatch]);

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
        {allConversations.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-text-sub">
            {search ? 'Ничего не найдено' : 'Нет чатов'}
          </div>
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
