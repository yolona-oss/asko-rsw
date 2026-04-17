'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { chatApi } from '@/lib/api/chat';
import { useChatSocket } from '@/lib/hooks/use-chat-socket';
import { MessageList } from '@/components/chat/message-list';
import { MessageInput } from '@/components/chat/message-input';
import { TypingIndicator } from '@/components/chat/typing-indicator';
import type { ChatConversation, ChatMessage } from '@/lib/chat-types';

export function RequestChat({ conversationId, currentUserId }: { conversationId: string; currentUserId: string }) {
  const [conversation, setConversation] = useState<ChatConversation | null>(null);
  const [realtimeMessages, setRealtimeMessages] = useState<ChatMessage[]>([]);
  const [typingUsers, setTypingUsers] = useState<Map<string, string>>(new Map());
  const typingTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const socketActions = useChatSocket({
    onNewMessage: useCallback((message: ChatMessage) => {
      if (message.conversationId === conversationId) {
        setRealtimeMessages(prev => [...prev, message]);
      }
    }, [conversationId]),
    onUserTyping: useCallback((data: { userId: string; conversationId: string }) => {
      if (data.conversationId !== conversationId || data.userId === currentUserId) return;
      setTypingUsers(prev => { const m = new Map(prev); m.set(data.userId, data.conversationId); return m; });
      const existing = typingTimers.current.get(data.userId);
      if (existing) clearTimeout(existing);
      typingTimers.current.set(data.userId, setTimeout(() => {
        setTypingUsers(prev => { const m = new Map(prev); m.delete(data.userId); return m; });
      }, 3000));
    }, [conversationId, currentUserId]),
    onUserStopTyping: useCallback((data: { userId: string }) => {
      setTypingUsers(prev => { const m = new Map(prev); m.delete(data.userId); return m; });
    }, []),
  });

  useEffect(() => {
    chatApi.getConversation(conversationId, true).then(({ data }) => setConversation(data.conversation)).catch(() => { });
  }, [conversationId]);

  useEffect(() => {
    if (!conversation) return;
    socketActions.joinConversation(conversationId);
    return () => { socketActions.leaveConversation(conversationId); };
  }, [conversation, conversationId, socketActions]);

  const typingNames: string[] = [];
  typingUsers.forEach((convId, userId) => {
    if (convId === conversationId && userId !== currentUserId) typingNames.push('Пользователь');
  });

  if (!conversation) return <p className="text-xs text-text-sub p-4">Загрузка чата...</p>;

  const isParticipant = conversation.participants.some(p => p.userId === currentUserId);
  if (!isParticipant) {
    return <p className="text-sm text-text-sub p-4">Вы не подключены к этому чату. Нажмите «Принять чат» чтобы присоединиться.</p>;
  }

  return (
    <div className="flex flex-col h-[400px]">
      <MessageList
        conversationId={conversationId}
        currentUserId={currentUserId}
        isGroup
        realtimeMessages={realtimeMessages}
        participantNames={{}}
        participantRoles={{}}
        readPositions={{}}
        participants={conversation.participants}
      />
      <TypingIndicator userNames={typingNames} />
      <MessageInput
        conversationId={conversationId}
        onMessageSent={() => { }}
        onTyping={() => socketActions.emitTyping(conversationId)}
        onStopTyping={() => socketActions.emitStopTyping(conversationId)}
      />
    </div>
  );
}
