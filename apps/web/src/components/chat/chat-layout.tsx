'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useChatSocket } from '@/lib/hooks/use-chat-socket';
import { chatApi } from '@/lib/api/chat';
import { ConversationList } from './conversation-list';
import { ConversationPanel } from './conversation-panel';
import { ChatEmptyState } from './chat-empty-state';
import { NewConversationDialog } from './new-conversation-dialog';
import type { ChatConversation, ChatMessage } from '@/lib/chat-types';

interface ChatLayoutProps {
  currentUserId: string;
  initialConversationId?: string;
}

export function ChatLayout({ currentUserId, initialConversationId }: ChatLayoutProps) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [activeConversation, setActiveConversation] = useState<ChatConversation | null>(null);
  const [showNewChat, setShowNewChat] = useState(false);
  const [presenceMap, setPresenceMap] = useState<Record<string, boolean>>({});
  const [typingUsers, setTypingUsers] = useState<Map<string, string>>(new Map());
  const [realtimeMessages, setRealtimeMessages] = useState<ChatMessage[]>([]);
  const typingTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const initialConversationHandled = useRef(false);

  // Participant name cache (userId → display name)
  const [participantNames] = useState<Record<string, string>>({});

  // Auto-open conversation from ?conversation= query parameter (notification links)
  useEffect(() => {
    if (!initialConversationId || initialConversationHandled.current) return;
    initialConversationHandled.current = true;

    chatApi.getConversation(initialConversationId, true)
      .then(({ data }) => {
        setActiveConversation(data.conversation);
        router.replace('/account/chat', { scroll: false });
      })
      .catch(() => {
        // Conversation may have been deleted
      });
  }, [initialConversationId, router]);

  const socketActions = useChatSocket({
    onNewMessage: useCallback((message: ChatMessage) => {
      setRealtimeMessages(prev => [...prev, message]);
      // Update conversations list
      queryClient.invalidateQueries({ queryKey: ['chat-conversations'] });
    }, [queryClient]),

    onMessageUpdated: useCallback((message: ChatMessage) => {
      queryClient.invalidateQueries({ queryKey: ['chat-messages', message.conversationId] });
    }, [queryClient]),

    onMessageDeleted: useCallback(({ messageId }: { messageId: string }) => {
      setRealtimeMessages(prev => prev.filter(m => m.id !== messageId));
      // Also invalidate to refresh from server
      if (activeConversation) {
        queryClient.invalidateQueries({ queryKey: ['chat-messages', activeConversation.id] });
      }
    }, [queryClient, activeConversation]),

    onUserTyping: useCallback(({ userId, conversationId }: { userId: string; conversationId: string }) => {
      setTypingUsers(prev => {
        const next = new Map(prev);
        next.set(userId, conversationId);
        return next;
      });
      // Auto-expire after 3 seconds
      const existing = typingTimers.current.get(userId);
      if (existing) clearTimeout(existing);
      typingTimers.current.set(userId, setTimeout(() => {
        setTypingUsers(prev => {
          const next = new Map(prev);
          next.delete(userId);
          return next;
        });
        typingTimers.current.delete(userId);
      }, 3000));
    }, []),

    onUserStopTyping: useCallback(({ userId }: { userId: string }) => {
      setTypingUsers(prev => {
        const next = new Map(prev);
        next.delete(userId);
        return next;
      });
      const existing = typingTimers.current.get(userId);
      if (existing) {
        clearTimeout(existing);
        typingTimers.current.delete(userId);
      }
    }, []),

    onUserPresence: useCallback(({ userId, status }: { userId: string; status: string }) => {
      setPresenceMap(prev => ({ ...prev, [userId]: status === 'online' }));
    }, []),

    onMessageRead: useCallback(() => {
      // Could update read receipts UI here
    }, []),

    onConversationNew: useCallback(() => {
      queryClient.invalidateQueries({ queryKey: ['chat-conversations'] });
    }, [queryClient]),
  });

  const handleSelectConversation = useCallback((conversation: ChatConversation) => {
    // Clear realtime messages for the previous conversation
    setRealtimeMessages([]);
    setActiveConversation(conversation);
  }, []);

  const handleBack = useCallback(() => {
    setActiveConversation(null);
  }, []);

  const handleConversationCreated = useCallback((conversation: ChatConversation) => {
    setShowNewChat(false);
    setActiveConversation(conversation);
    queryClient.invalidateQueries({ queryKey: ['chat-conversations'] });
  }, [queryClient]);

  return (
    <>
      <div className="flex h-[calc(100vh-120px)] bg-white border border-border-light rounded-sm overflow-hidden">
        {/* Left panel: conversation list */}
        <div className={`w-full lg:w-80 lg:border-r lg:border-border-light flex-shrink-0 ${
          activeConversation ? 'hidden lg:flex lg:flex-col' : 'flex flex-col'
        }`}>
          <ConversationList
            activeId={activeConversation?.id ?? null}
            currentUserId={currentUserId}
            presenceMap={presenceMap}
            onSelect={handleSelectConversation}
            onNewChat={() => setShowNewChat(true)}
          />
        </div>

        {/* Right panel: active conversation or empty state */}
        <div className={`flex-1 flex flex-col ${
          activeConversation ? 'flex' : 'hidden lg:flex'
        }`}>
          {activeConversation ? (
            <ConversationPanel
              conversation={activeConversation}
              currentUserId={currentUserId}
              presenceMap={presenceMap}
              socketActions={socketActions}
              typingUsers={typingUsers}
              realtimeMessages={realtimeMessages}
              onBack={handleBack}
              participantNames={participantNames}
            />
          ) : (
            <ChatEmptyState />
          )}
        </div>
      </div>

      {showNewChat && (
        <NewConversationDialog
          onClose={() => setShowNewChat(false)}
          onCreated={handleConversationCreated}
        />
      )}
    </>
  );
}
