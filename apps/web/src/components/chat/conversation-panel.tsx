'use client';

import { useEffect, useCallback, useRef, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Avatar } from '@asko/ui';
import { PresenceDot } from './presence-dot';
import { MessageList } from './message-list';
import { MessageInput } from './message-input';
import { TypingIndicator } from './typing-indicator';
import { notificationApi } from '@/lib/api/notification';
import { setActiveConversation } from '@/lib/active-conversation';
import { useUserAvatars } from '@/hooks/use-user-avatars';
import type { NotificationRecord } from '@/lib/api/types';
import type { ChatConversation, ChatMessage } from '@/lib/chat-types';
import type { ChatSocketActions } from '@/lib/hooks/use-chat-socket';

const CHAT_NOTIFICATION_TYPES = new Set(['chat_message', 'chat_conversation_created', 'chat_participant_added']);

interface ConversationPanelProps {
  conversation: ChatConversation;
  currentUserId: string;
  presenceMap: Record<string, boolean>;
  socketActions: ChatSocketActions;
  typingUsers: Map<string, string>;
  realtimeMessages: ChatMessage[];
  onBack?: () => void;
  participantNames: Record<string, string>;
}

export function ConversationPanel({
  conversation,
  currentUserId,
  presenceMap,
  socketActions,
  typingUsers,
  realtimeMessages,
  onBack,
  participantNames,
}: ConversationPanelProps) {
  const queryClient = useQueryClient();

  // Join/leave conversation room + mark messages as read + track active conversation
  useEffect(() => {
    setActiveConversation(conversation.id);
    socketActions.joinConversation(conversation.id);

    // Mark last message as read to reset unread count
    const lastMsg = conversation.lastMessage;
    if (lastMsg && lastMsg.senderId !== currentUserId) {
      socketActions.emitMarkAsRead(conversation.id, lastMsg.id);
      queryClient.invalidateQueries({ queryKey: ['chat-conversations'] });
    }

    return () => {
      socketActions.leaveConversation(conversation.id);
      setActiveConversation(null);
    };
  }, [conversation.id, socketActions, currentUserId, queryClient]);

  // Mark incoming realtime messages as read while viewing
  const lastMarkedRef = useRef<string | null>(null);
  useEffect(() => {
    const incoming = realtimeMessages.filter(
      (m) => m.conversationId === conversation.id && m.senderId !== currentUserId,
    );
    const last = incoming[incoming.length - 1];
    if (last && last.id !== lastMarkedRef.current) {
      lastMarkedRef.current = last.id;
      socketActions.emitMarkAsRead(conversation.id, last.id);
      queryClient.invalidateQueries({ queryKey: ['chat-conversations'] });
    }
  }, [realtimeMessages, conversation.id, currentUserId, socketActions, queryClient]);

  // Dismiss notification-bell entries for this conversation
  useEffect(() => {
    type ListCache = { data: NotificationRecord[]; overallCount: number };
    const cache = queryClient.getQueryData<ListCache>(['notifications-unread-list']);
    if (!cache) return;

    const toMark = cache.data.filter(
      (n) => CHAT_NOTIFICATION_TYPES.has(n.type) && n.targetId === conversation.id,
    );
    if (toMark.length === 0) return;

    const ids = new Set(toMark.map((n) => n.id));

    // Optimistic: remove from bell list + decrement badge
    queryClient.setQueryData<ListCache>(['notifications-unread-list'], (old) => {
      if (!old) return old;
      return {
        ...old,
        data: old.data.filter((n) => !ids.has(n.id)),
        overallCount: Math.max(0, old.overallCount - toMark.length),
      };
    });
    queryClient.setQueryData<{ count: number }>(['notifications-unread-count'], (old) => ({
      count: Math.max(0, (old?.count ?? 0) - toMark.length),
    }));

    // Fire mark-as-read API for each (silent, no refetch)
    toMark.forEach((n) => notificationApi.markAsRead(n.id));
  }, [conversation.id, queryClient, realtimeMessages.length]);

  const otherParticipant = conversation.participants.find(p => p.userId !== currentUserId);
  const displayName = conversation.name || participantNames[otherParticipant?.userId ?? ''] || 'Чат';
  const isDirect = conversation.type === 'direct';
  const otherIds = useMemo(() => otherParticipant && isDirect ? [otherParticipant.userId] : [], [otherParticipant, isDirect]);
  const avatarMap = useUserAvatars(otherIds);
  const headerAvatarSrc = isDirect && otherParticipant ? (avatarMap[otherParticipant.userId] ?? undefined) : conversation.avatarUrl;
  const isOnline = otherParticipant ? (presenceMap[otherParticipant.userId] ?? false) : false;
  const isGroup = conversation.type === 'group';

  // Typing indicator names for this conversation
  const typingNames: string[] = [];
  typingUsers.forEach((convId, userId) => {
    if (convId === conversation.id && userId !== currentUserId) {
      typingNames.push(participantNames[userId] ?? 'Пользователь');
    }
  });

  const handleMessageSent = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['chat-messages', conversation.id] });
    queryClient.invalidateQueries({ queryKey: ['chat-conversations'] });
  }, [queryClient, conversation.id]);

  const handleTyping = useCallback(() => {
    socketActions.emitTyping(conversation.id);
  }, [socketActions, conversation.id]);

  const handleStopTyping = useCallback(() => {
    socketActions.emitStopTyping(conversation.id);
  }, [socketActions, conversation.id]);

  // Filter realtime messages for this conversation
  const conversationRealtimeMessages = realtimeMessages.filter(
    m => m.conversationId === conversation.id,
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border-light">
        {onBack && (
          <button type="button" onClick={onBack} className="lg:hidden cursor-pointer">
            <svg className="w-5 h-5 text-text-main" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
        )}
        <div className="relative flex-shrink-0">
          <Avatar size="md" src={headerAvatarSrc} fallback={displayName.slice(0, 2)} />
          {isDirect && (
            <PresenceDot online={isOnline} className="absolute -bottom-0.5 -right-0.5" />
          )}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-text-main truncate">{displayName}</p>
          {isDirect && (
            <p className="text-xs text-text-sub">{isOnline ? 'В сети' : 'Не в сети'}</p>
          )}
          {isGroup && (
            <p className="text-xs text-text-sub">{conversation.participants.length} участников</p>
          )}
        </div>
      </div>

      {/* Messages */}
      <MessageList
        conversationId={conversation.id}
        currentUserId={currentUserId}
        isGroup={isGroup}
        realtimeMessages={conversationRealtimeMessages}
        participantNames={participantNames}
      />

      {/* Typing indicator */}
      <TypingIndicator userNames={typingNames} />

      {/* Input */}
      <MessageInput
        conversationId={conversation.id}
        onMessageSent={handleMessageSent}
        onTyping={handleTyping}
        onStopTyping={handleStopTyping}
      />
    </div>
  );
}
