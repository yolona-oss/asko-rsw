'use client';

import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { chatApi } from '@/lib/api/chat';
import { MessageBubble } from './message-bubble';
import type { ChatMessage, ChatParticipant } from '@/lib/chat-types';

interface MessageListProps {
  conversationId: string;
  currentUserId: string;
  isGroup: boolean;
  realtimeMessages: ChatMessage[];
  participantNames: Record<string, string>;
  participantRoles: Record<string, string>;
  readPositions: Record<string, string>;
  participants: ChatParticipant[];
}

export function MessageList({
  conversationId,
  currentUserId,
  isGroup,
  realtimeMessages,
  participantNames,
  participantRoles,
  readPositions,
  participants,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const initialScrollDone = useRef(false);
  const loadingOlder = useRef(false);
  const [olderMessages, setOlderMessages] = useState<ChatMessage[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const MESSAGES_LIMIT = 50;

  const { data, isLoading } = useQuery({
    queryKey: ['chat-messages', conversationId],
    queryFn: async () => {
      const { data } = await chatApi.listMessages(conversationId, { limit: MESSAGES_LIMIT });
      return data;
    },
  });

  const fetchedMessages = data?.data ?? [];

  // If the initial fetch returned fewer than the limit, all messages are already loaded
  useEffect(() => {
    if (data && (data.data?.length ?? 0) < MESSAGES_LIMIT) {
      setHasMore(false);
    }
  }, [data]);

  // Combine all messages: older loaded + initial fetch + realtime
  const allMessages = useMemo(
    () =>
      [...olderMessages, ...fetchedMessages, ...realtimeMessages]
        .filter((m, i, arr) => arr.findIndex(x => x.id === m.id) === i)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    [olderMessages, fetchedMessages, realtimeMessages],
  );

  // Reset state when conversation changes
  useEffect(() => {
    initialScrollDone.current = false;
    loadingOlder.current = false;
    setOlderMessages([]);
    setHasMore(true);
    setLoadingMore(false);
  }, [conversationId]);

  // Instant scroll to bottom on first load
  useEffect(() => {
    if (!isLoading && allMessages.length > 0 && !initialScrollDone.current) {
      initialScrollDone.current = true;
      // Use requestAnimationFrame to ensure DOM has rendered
      requestAnimationFrame(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'auto' });
      });
    }
  }, [isLoading, allMessages.length]);

  // Smooth scroll on new realtime messages — only if near bottom
  const prevRealtimeLen = useRef(realtimeMessages.length);
  useEffect(() => {
    if (!initialScrollDone.current) return;
    if (realtimeMessages.length <= prevRealtimeLen.current) {
      prevRealtimeLen.current = realtimeMessages.length;
      return;
    }
    prevRealtimeLen.current = realtimeMessages.length;

    const container = containerRef.current;
    if (!container) return;
    const nearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 150;
    if (nearBottom) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [realtimeMessages.length]);

  // Load older messages with scroll position preservation
  const loadOlderMessages = useCallback(async () => {
    if (!hasMore || allMessages.length === 0 || loadingOlder.current) return;
    loadingOlder.current = true;
    setLoadingMore(true);

    const container = containerRef.current;
    const prevScrollHeight = container?.scrollHeight ?? 0;

    const oldest = allMessages[0];
    try {
      const { data: older } = await chatApi.listMessages(conversationId, {
        limit: MESSAGES_LIMIT,
        beforeId: oldest.id,
      });
      const olderData = older.data ?? [];
      if (olderData.length < MESSAGES_LIMIT) {
        setHasMore(false);
      }
      if (olderData.length > 0) {
        setOlderMessages(prev => [...olderData, ...prev]);
        // Preserve scroll position after prepend
        requestAnimationFrame(() => {
          if (container) {
            container.scrollTop += container.scrollHeight - prevScrollHeight;
          }
        });
      }
    } catch {
      // Ignore fetch errors
    } finally {
      loadingOlder.current = false;
      setLoadingMore(false);
    }
  }, [hasMore, allMessages, conversationId]);

  // IntersectionObserver to auto-load older messages on scroll to top
  useEffect(() => {
    const sentinel = sentinelRef.current;
    const container = containerRef.current;
    if (!sentinel || !container || !initialScrollDone.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingOlder.current) {
          loadOlderMessages();
        }
      },
      { root: container, threshold: 0.1 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadOlderMessages]);

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

  // Build message order index: messageId → position (0-based, chronological)
  const messageOrderIndex = useMemo(() => {
    const idx = new Map<string, number>();
    allMessages.forEach((m, i) => idx.set(m.id, i));
    return idx;
  }, [allMessages]);

  // Other participants (for read receipts on own messages)
  const otherParticipants = useMemo(
    () => participants.filter(p => p.userId !== currentUserId),
    [participants, currentUserId],
  );

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-sm text-text-sub">Загрузка...</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto px-4 py-3">
      {/* Sentinel for infinite scroll + loading spinner */}
      <div ref={sentinelRef} className="h-1" />
      {loadingMore && (
        <div className="flex justify-center py-2">
          <Loader2 className="w-4 h-4 animate-spin text-text-sub" />
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
            senderRole={participantRoles[msg.senderId]}
            readPositions={readPositions}
            messageOrderIndex={messageOrderIndex}
            otherParticipants={otherParticipants}
            participantNames={participantNames}
          />
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
