'use client';

import { useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Avatar } from '@asko/ui';
import { PresenceDot } from './presence-dot';
import { MessageList } from './message-list';
import { MessageInput } from './message-input';
import { TypingIndicator } from './typing-indicator';
import type { ChatConversation, ChatMessage } from '@/lib/chat-types';
import type { ChatSocketActions } from '@/lib/hooks/use-chat-socket';

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

  // Join/leave conversation room
  useEffect(() => {
    socketActions.joinConversation(conversation.id);
    return () => {
      socketActions.leaveConversation(conversation.id);
    };
  }, [conversation.id, socketActions]);

  const otherParticipant = conversation.participants.find(p => p.userId !== currentUserId);
  const displayName = conversation.name || participantNames[otherParticipant?.userId ?? ''] || 'Чат';
  const isDirect = conversation.type === 'direct';
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
          <Avatar size="md" fallback={displayName.slice(0, 2)} />
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
