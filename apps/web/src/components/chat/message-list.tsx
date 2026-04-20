'use client';

import { useEffect, useRef, useMemo, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '@/store/index';
import { selectMessagesForConversation, selectMessagePagination, fetchMessages } from '@/store/chat';
import { MessageBubble } from './message-bubble';
import type { ChatParticipantRecord } from '@/lib/api/types';

interface MessageListProps {
  conversationId: string;
  currentUserId: string;
  isGroup: boolean;
  participantNames: Record<string, string>;
  participantRoles: Record<string, string>;
  readPositions: Record<string, string>;
  participants: ChatParticipantRecord[];
}

export function MessageList({
  conversationId,
  currentUserId,
  isGroup,
  participantNames,
  participantRoles,
  readPositions,
  participants,
}: MessageListProps) {
  const dispatch = useAppDispatch();
  const bottomRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const initialScrollDone = useRef(false);
  const loadingOlder = useRef(false);

  const allMessages = useAppSelector(state => selectMessagesForConversation(state, conversationId));
  const pagination = useAppSelector(state => selectMessagePagination(state, conversationId));
  const { hasMore, loading: loadingMore } = pagination;

  // Fetch initial messages
  useEffect(() => {
    dispatch(fetchMessages({ conversationId }));
  }, [conversationId, dispatch]);

  // Reset scroll state when conversation changes
  useEffect(() => {
    initialScrollDone.current = false;
    loadingOlder.current = false;
  }, [conversationId]);

  // Instant scroll to bottom on first load
  useEffect(() => {
    if (!loadingMore && allMessages.length > 0 && !initialScrollDone.current) {
      initialScrollDone.current = true;
      requestAnimationFrame(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'auto' });
      });
    }
  }, [loadingMore, allMessages.length]);

  // Smooth scroll on new messages — only if near bottom
  const prevMessageCount = useRef(allMessages.length);
  useEffect(() => {
    if (!initialScrollDone.current) return;
    if (allMessages.length <= prevMessageCount.current) {
      prevMessageCount.current = allMessages.length;
      return;
    }
    prevMessageCount.current = allMessages.length;

    const container = containerRef.current;
    if (!container) return;
    const nearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 150;
    if (nearBottom) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [allMessages.length]);

  // Load older messages with scroll position preservation
  const loadOlderMessages = useCallback(() => {
    if (!hasMore || allMessages.length === 0 || loadingOlder.current) return;
    loadingOlder.current = true;

    const container = containerRef.current;
    const prevScrollHeight = container?.scrollHeight ?? 0;

    const oldest = allMessages[0];
    dispatch(fetchMessages({ conversationId, beforeId: oldest.id }))
      .finally(() => {
        loadingOlder.current = false;
        // Preserve scroll position after prepend
        requestAnimationFrame(() => {
          if (container) {
            container.scrollTop += container.scrollHeight - prevScrollHeight;
          }
        });
      });
  }, [hasMore, allMessages, conversationId, dispatch]);

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
    return allMessages.reduce<Array<{ msg: typeof allMessages[number]; showSeparator: boolean; dateLabel: string }>>((acc, msg) => {
      const msgDate = new Date(msg.createdAt).toDateString();
      const prevDate = acc.length > 0 ? new Date(acc[acc.length - 1].msg.createdAt).toDateString() : '';
      const showSeparator = msgDate !== prevDate;
      acc.push({ msg, showSeparator, dateLabel: showSeparator ? formatDateSeparator(msg.createdAt) : '' });
      return acc;
    }, []);
  }, [allMessages]);

  const receiptsMap = useMemo(() => {
    const others = participants.filter(p => p.userId !== currentUserId);
    if (others.length === 0) return new Map<string, { userId: string; seen: boolean }[]>();

    const orderIndex = new Map<string, number>();
    allMessages.forEach((m, i) => orderIndex.set(m.id, i));

    const participantReadOrder = new Map<string, number>();
    for (const p of others) {
      const readMsgId = readPositions[p.userId];
      if (readMsgId) {
        const order = orderIndex.get(readMsgId);
        if (order !== undefined) participantReadOrder.set(p.userId, order);
      }
    }

    const map = new Map<string, { userId: string; seen: boolean }[]>();
    for (const msg of allMessages) {
      if (msg.senderId !== currentUserId) continue;
      const myOrder = orderIndex.get(msg.id)!;
      map.set(msg.id, others.map(p => {
        const readOrder = participantReadOrder.get(p.userId);
        return { userId: p.userId, seen: readOrder !== undefined && readOrder >= myOrder };
      }));
    }
    return map;
  }, [allMessages, participants, currentUserId, readPositions]);

  if (loadingMore && allMessages.length === 0) {
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
            receipts={receiptsMap.get(msg.id) ?? null}
            participantNames={participantNames}
          />
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
