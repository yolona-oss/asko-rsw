'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { chatApi } from '@/lib/api/chat';
import { MessageBubble } from './message-bubble';
import type { ChatMessage } from '@/lib/chat-types';

interface MessageListProps {
  conversationId: string;
  currentUserId: string;
  isGroup: boolean;
  realtimeMessages: ChatMessage[];
  participantNames: Record<string, string>;
}

export function MessageList({
  conversationId,
  currentUserId,
  isGroup,
  realtimeMessages,
  participantNames,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [beforeId, setBeforeId] = useState<string | undefined>(undefined);
  const [olderMessages, setOlderMessages] = useState<ChatMessage[]>([]);
  const [hasMore, setHasMore] = useState(true);

  const { data, isLoading } = useQuery({
    queryKey: ['chat-messages', conversationId],
    queryFn: async () => {
      const { data } = await chatApi.listMessages(conversationId, { limit: 50 });
      return data;
    },
  });

  const fetchedMessages = data?.data ?? [];

  // Combine all messages: older loaded + initial fetch + realtime
  const allMessages = [...olderMessages, ...fetchedMessages, ...realtimeMessages]
    .filter((m, i, arr) => arr.findIndex(x => x.id === m.id) === i)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [allMessages.length]);

  const loadOlder = async () => {
    if (!hasMore || allMessages.length === 0) return;
    const oldest = allMessages[0];
    try {
      const { data: older } = await chatApi.listMessages(conversationId, {
        limit: 50,
        beforeId: beforeId || oldest.id,
      });
      if (older.data.length === 0) {
        setHasMore(false);
      } else {
        setOlderMessages(prev => [...older.data, ...prev]);
        setBeforeId(older.data[0].id);
      }
    } catch {}
  };

  // Date separator helper
  function formatDateSeparator(dateStr: string): string {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Сегодня';
    if (date.toDateString() === yesterday.toDateString()) return 'Вчера';
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  // Build date separators as part of the message list without mutable variables
  const messagesWithSeparators = useMemo(() => {
    return allMessages.reduce<Array<{ msg: ChatMessage; showSeparator: boolean; dateLabel: string }>>((acc, msg) => {
      const msgDate = new Date(msg.createdAt).toDateString();
      const prevDate = acc.length > 0 ? new Date(acc[acc.length - 1].msg.createdAt).toDateString() : '';
      const showSeparator = msgDate !== prevDate;
      acc.push({ msg, showSeparator, dateLabel: showSeparator ? formatDateSeparator(msg.createdAt) : '' });
      return acc;
    }, []);
  }, [allMessages]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-sm text-text-sub">Загрузка...</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto px-4 py-3">
      {hasMore && allMessages.length > 0 && (
        <div className="text-center mb-3">
          <button
            type="button"
            onClick={loadOlder}
            className="text-xs text-brand-red hover:underline cursor-pointer"
          >
            Загрузить ранние сообщения
          </button>
        </div>
      )}
      {messagesWithSeparators.map(({ msg, showSeparator, dateLabel }) => (
        <div key={msg.id}>
          {showSeparator && (
            <div className="flex items-center gap-3 my-3">
              <div className="flex-1 h-px bg-border-light" />
              <span className="text-xs text-text-sub/60">{dateLabel}</span>
              <div className="flex-1 h-px bg-border-light" />
            </div>
          )}
          <MessageBubble
            message={msg}
            isOwn={msg.senderId === currentUserId}
            showSender={isGroup}
            senderName={participantNames[msg.senderId] ?? 'Пользователь'}
          />
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
